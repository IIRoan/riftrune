#!/usr/bin/env bun

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseTurboTestOutput, printTestSummary } from './lib/test-summary.mjs';

const root = join(import.meta.dirname, '..');

function run(command, args, { cwd = root, allowFail = false, capture = false } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit',
  });

  if (capture) {
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
    process.stdout.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    result.combinedOutput = output;
  }

  if (!allowFail && result.status !== 0) {
    result.failed = true;
  }

  return result;
}

function readEnvValue(key) {
  const envPath = join(root, 'apps/api/.env');
  if (!existsSync(envPath)) return undefined;

  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    if (trimmed.slice(0, separator).trim() !== key) continue;
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    return value;
  }

  return undefined;
}

async function waitForPostgres() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const ready = spawnSync(
      'docker',
      ['exec', 'riftbound-postgres', 'pg_isready', '-U', 'riftbound', '-d', 'riftbound'],
      { encoding: 'utf8' }
    );
    if (ready.status === 0) return;
    await Bun.sleep(1_000);
  }

  console.error('Postgres did not become ready within 60 seconds.');
  process.exit(1);
}

function ensureTestDatabase() {
  const check = spawnSync(
    'docker',
    [
      'exec',
      'riftbound-postgres',
      'psql',
      '-U',
      'riftbound',
      '-d',
      'riftbound',
      '-tAc',
      "SELECT 1 FROM pg_database WHERE datname = 'riftbound_test'",
    ],
    { encoding: 'utf8' }
  );

  if (check.stdout.trim() === '1') return;

  run('docker', [
    'exec',
    'riftbound-postgres',
    'psql',
    '-U',
    'riftbound',
    '-d',
    'riftbound',
    '-c',
    'CREATE DATABASE riftbound_test',
  ]);
}

if (existsSync(join(root, 'docker-compose.yml'))) {
  run('docker', ['compose', 'up', '-d', 'postgres']);
  await waitForPostgres();
  ensureTestDatabase();
}

process.env.TEST_DB_URL ??=
  readEnvValue('TEST_DB_URL') ??
  'postgres://riftbound:riftbound@localhost:5433/riftbound_test';

const turbo = run('bun', ['run', 'turbo', 'test'], { capture: true, allowFail: true });
const { packages, breakdown } = parseTurboTestOutput(turbo.combinedOutput ?? '');
const totals = printTestSummary(packages, { breakdown });

if (packages.size === 0) {
  console.error('No test results were found in the output.');
  process.exit(turbo.status ?? 1);
}

process.exit(totals.failed > 0 || turbo.status !== 0 ? 1 : 0);
