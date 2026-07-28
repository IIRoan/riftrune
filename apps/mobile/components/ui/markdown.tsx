import { Linking, View } from 'react-native';
import type MarkdownIt from 'markdown-it';
import * as WebBrowser from 'expo-web-browser';
import { Text } from '@/components/ui/text';
import {
  getSafeMarkdownIt,
  isSafeMarkdownUrl,
  prepareMarkdownSource,
} from '@/lib/markdown-safe';
import { cn } from '@/lib/utils';
import { hapticPress } from '@/utils/haptics';

type Token = ReturnType<MarkdownIt['parse']>[number];

interface SecureMarkdownProps {
  children: string;
  className?: string;
}

const HEADING_CLASS: Record<number, string> = {
  1: 'text-xl font-bold leading-7 text-foreground',
  2: 'text-lg font-bold leading-6 text-foreground',
  3: 'text-base font-semibold leading-6 text-foreground',
  4: 'text-[15px] font-semibold leading-5 text-foreground',
  5: 'text-sm font-semibold leading-5 text-foreground',
  6: 'text-sm font-medium leading-5 text-muted-foreground',
};

async function openSafeUrl(url: string) {
  if (!isSafeMarkdownUrl(url)) return;
  hapticPress();
  try {
    if (url.trim().toLowerCase().startsWith('mailto:')) {
      await Linking.openURL(url);
      return;
    }
    await WebBrowser.openBrowserAsync(url);
  } catch {
    // Ignore failed opens (unsupported scheme / no mail client).
  }
}

function renderInline(
  tokens: Token[] | null | undefined,
  keyPrefix: string
): React.ReactNode[] {
  if (!tokens?.length) return [];

  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i]!;
    const key = `${keyPrefix}-${i}-${token.type}`;

    switch (token.type) {
      case 'text':
        nodes.push(token.content);
        i += 1;
        break;
      case 'softbreak':
      case 'hardbreak':
        nodes.push('\n');
        i += 1;
        break;
      case 'code_inline':
        nodes.push(
          <Text
            key={key}
            className="rounded-sm bg-muted px-1 font-mono text-[12px] text-foreground"
          >
            {token.content}
          </Text>
        );
        i += 1;
        break;
      case 'strong_open': {
        const close = findClosingIndex(tokens, i, 'strong_close');
        nodes.push(
          <Text key={key} className="font-bold text-foreground">
            {renderInline(tokens.slice(i + 1, close), key)}
          </Text>
        );
        i = close + 1;
        break;
      }
      case 'em_open': {
        const close = findClosingIndex(tokens, i, 'em_close');
        nodes.push(
          <Text key={key} className="italic text-foreground">
            {renderInline(tokens.slice(i + 1, close), key)}
          </Text>
        );
        i = close + 1;
        break;
      }
      case 's_open': {
        const close = findClosingIndex(tokens, i, 's_close');
        nodes.push(
          <Text key={key} className="text-foreground line-through">
            {renderInline(tokens.slice(i + 1, close), key)}
          </Text>
        );
        i = close + 1;
        break;
      }
      case 'link_open': {
        const href = token.attrGet('href') ?? '';
        const close = findClosingIndex(tokens, i, 'link_close');
        const label = renderInline(tokens.slice(i + 1, close), key);
        if (isSafeMarkdownUrl(href)) {
          nodes.push(
            <Text
              key={key}
              accessibilityRole="link"
              className="font-medium text-primary underline"
              onPress={() => void openSafeUrl(href)}
            >
              {label}
            </Text>
          );
        } else {
          nodes.push(<Text key={key}>{label}</Text>);
        }
        i = close + 1;
        break;
      }
      case 'image':
        i += 1;
        break;
      default:
        if (token.children?.length) {
          nodes.push(...renderInline(token.children, key));
        } else if (token.content) {
          nodes.push(token.content);
        }
        i += 1;
        break;
    }
  }

  return nodes;
}

function findClosingIndex(tokens: Token[], openIndex: number, closeType: string): number {
  const openType = tokens[openIndex]?.type ?? '';
  const openBase = openType.replace(/_open$/, '');
  let depth = 0;

  for (let i = openIndex + 1; i < tokens.length; i += 1) {
    const type = tokens[i]?.type ?? '';
    if (type === `${openBase}_open`) depth += 1;
    if (type === closeType) {
      if (depth === 0) return i;
      depth -= 1;
    }
  }

  return tokens.length - 1;
}

function renderBlocks(tokens: Token[]): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let listKey = 0;

  while (i < tokens.length) {
    const token = tokens[i]!;
    const key = `b-${i}-${token.type}`;

    if (token.type === 'heading_open') {
      const level = Number(token.tag.replace('h', '')) || 3;
      const inline = tokens[i + 1];
      nodes.push(
        <Text key={key} className={HEADING_CLASS[level] ?? HEADING_CLASS[3]}>
          {renderInline(inline?.children, key)}
        </Text>
      );
      i += 3;
      continue;
    }

    if (token.type === 'paragraph_open') {
      const inline = tokens[i + 1];
      nodes.push(
        <Text key={key} className="text-[13px] leading-5 text-foreground">
          {renderInline(inline?.children, key)}
        </Text>
      );
      i += 3;
      continue;
    }

    if (token.type === 'blockquote_open') {
      const close = findClosingIndex(tokens, i, 'blockquote_close');
      nodes.push(
        <View key={key} className="gap-2 border-l-2 border-border pl-3">
          {renderBlocks(tokens.slice(i + 1, close))}
        </View>
      );
      i = close + 1;
      continue;
    }

    if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') {
      const ordered = token.type === 'ordered_list_open';
      const closeType = ordered ? 'ordered_list_close' : 'bullet_list_close';
      const close = findClosingIndex(tokens, i, closeType);
      const items: React.ReactNode[] = [];
      let j = i + 1;
      let itemIndex = 0;

      while (j < close) {
        const item = tokens[j]!;
        if (item.type !== 'list_item_open') {
          j += 1;
          continue;
        }
        const itemClose = findClosingIndex(tokens, j, 'list_item_close');
        const marker = ordered ? `${itemIndex + 1}.` : '•';
        items.push(
          <View key={`${key}-li-${itemIndex}`} className="flex-row gap-2">
            <Text className="w-4 text-[13px] leading-5 text-muted-foreground">{marker}</Text>
            <View className="min-w-0 flex-1 gap-1.5">
              {renderBlocks(tokens.slice(j + 1, itemClose))}
            </View>
          </View>
        );
        itemIndex += 1;
        j = itemClose + 1;
      }

      nodes.push(
        <View key={`${key}-${listKey++}`} className="gap-1.5">
          {items}
        </View>
      );
      i = close + 1;
      continue;
    }

    if (token.type === 'fence' || token.type === 'code_block') {
      nodes.push(
        <View key={key} className="rounded-md border border-border bg-muted px-2.5 py-2">
          <Text className="font-mono text-[12px] leading-5 text-foreground">
            {token.content.replace(/\n$/, '')}
          </Text>
        </View>
      );
      i += 1;
      continue;
    }

    if (token.type === 'hr') {
      nodes.push(<View key={key} className="my-1 h-px bg-border" />);
      i += 1;
      continue;
    }

    if (token.type === 'inline') {
      nodes.push(
        <Text key={key} className="text-[13px] leading-5 text-foreground">
          {renderInline(token.children, key)}
        </Text>
      );
      i += 1;
      continue;
    }

    i += 1;
  }

  return nodes;
}

/**
 * Renders user-authored markdown with a locked-down parser:
 * HTML off, images off, only http(s)/mailto links open in an in-app browser.
 */
export function SecureMarkdown({ children, className }: SecureMarkdownProps) {
  const source = prepareMarkdownSource(children);
  if (!source.trim()) return null;

  const tokens = getSafeMarkdownIt().parse(source, {});
  const blocks = renderBlocks(tokens);

  return <View className={cn('gap-2', className)}>{blocks}</View>;
}
