import { Linking, View } from 'react-native';
import type MarkdownIt from 'markdown-it';
import { Text } from '@/components/ui/text';
import { openExternalUrl } from '@/lib/open-external';
import {
  getSafeMarkdownIt,
  isSafeMarkdownUrl,
  prepareMarkdownSource,
} from '@/lib/markdown-safe';
import {
  extendSiblingPath,
  markdownListItemKey,
  markdownTokenKey,
} from '@/lib/markdown-keys';
import { cn } from '@/lib/utils';
import { hapticPress } from '@/utils/haptics';

type Token = ReturnType<MarkdownIt['parse']>[number];

interface SecureMarkdownProps {
  children: string;
  className?: string;
  variant?: 'compact' | 'prose';
}

const HEADING_CLASS_COMPACT: Record<number, string> = {
  1: 'text-xl font-bold leading-7 text-foreground',
  2: 'text-lg font-bold leading-6 text-foreground',
  3: 'text-base font-semibold leading-6 text-foreground',
  4: 'text-[15px] font-semibold leading-5 text-foreground',
  5: 'text-sm font-semibold leading-5 text-foreground',
  6: 'text-sm font-medium leading-5 text-muted-foreground',
};

const HEADING_CLASS_PROSE: Record<number, string> = {
  1: 'text-2xl font-bold leading-8 tracking-tight text-foreground',
  2: 'text-xl font-bold leading-7 text-foreground',
  3: 'text-lg font-semibold leading-6 text-foreground',
  4: 'text-base font-semibold leading-6 text-foreground',
  5: 'text-[15px] font-semibold leading-5 text-foreground',
  6: 'text-sm font-medium leading-5 text-muted-foreground',
};

async function openSafeUrl(url: string) {
  if (!isSafeMarkdownUrl(url)) return;
  try {
    if (url.trim().toLowerCase().startsWith('mailto:')) {
      hapticPress();
      await Linking.openURL(url);
      return;
    }
    await openExternalUrl(url);
  } catch {
    // Ignore failed opens (unsupported scheme / no mail client).
  }
}

function renderInline(
  tokens: Token[] | null | undefined,
  keyPrefix: string,
  prose: boolean
): React.ReactNode[] {
  if (!tokens?.length) return [];

  const nodes: React.ReactNode[] = [];
  let i = 0;
  let siblingPath = keyPrefix;
  const codeClass = prose
    ? 'rounded-md bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground'
    : 'rounded-sm bg-muted px-1 font-mono text-[12px] text-foreground';

  while (i < tokens.length) {
    const token = tokens[i]!;
    const key = markdownTokenKey(keyPrefix, token, siblingPath);

    switch (token.type) {
      case 'text':
        nodes.push(token.content);
        siblingPath = extendSiblingPath(siblingPath, token);
        i += 1;
        break;
      case 'softbreak':
      case 'hardbreak':
        nodes.push('\n');
        siblingPath = extendSiblingPath(siblingPath, token);
        i += 1;
        break;
      case 'code_inline':
        nodes.push(
          <Text key={key} className={codeClass}>
            {token.content}
          </Text>
        );
        siblingPath = extendSiblingPath(siblingPath, token);
        i += 1;
        break;
      case 'strong_open': {
        const close = findClosingIndex(tokens, i, 'strong_close');
        nodes.push(
          <Text key={key} className="font-bold text-foreground">
            {renderInline(tokens.slice(i + 1, close), key, prose)}
          </Text>
        );
        siblingPath = extendSiblingPath(siblingPath, token);
        i = close + 1;
        break;
      }
      case 'em_open': {
        const close = findClosingIndex(tokens, i, 'em_close');
        nodes.push(
          <Text key={key} className="italic text-foreground">
            {renderInline(tokens.slice(i + 1, close), key, prose)}
          </Text>
        );
        siblingPath = extendSiblingPath(siblingPath, token);
        i = close + 1;
        break;
      }
      case 's_open': {
        const close = findClosingIndex(tokens, i, 's_close');
        nodes.push(
          <Text key={key} className="text-foreground line-through">
            {renderInline(tokens.slice(i + 1, close), key, prose)}
          </Text>
        );
        siblingPath = extendSiblingPath(siblingPath, token);
        i = close + 1;
        break;
      }
      case 'link_open': {
        const href = token.attrGet('href') ?? '';
        const close = findClosingIndex(tokens, i, 'link_close');
        const label = renderInline(tokens.slice(i + 1, close), key, prose);
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
        siblingPath = extendSiblingPath(siblingPath, token);
        i = close + 1;
        break;
      }
      case 'image':
        siblingPath = extendSiblingPath(siblingPath, token);
        i += 1;
        break;
      default:
        if (token.children?.length) {
          nodes.push(...renderInline(token.children, key, prose));
        } else if (token.content) {
          nodes.push(token.content);
        }
        siblingPath = extendSiblingPath(siblingPath, token);
        i += 1;
        break;
    }
  }

  return nodes;
}

function findClosingIndex(
  tokens: Token[],
  openIndex: number,
  closeType: string
): number {
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

function renderBlocks(tokens: Token[], prose: boolean): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let siblingPath = 'md';
  const headingClass = prose ? HEADING_CLASS_PROSE : HEADING_CLASS_COMPACT;
  const bodyClass = prose
    ? 'text-[15px] leading-6 text-foreground'
    : 'text-[13px] leading-5 text-foreground';
  const markerClass = prose
    ? 'w-5 text-[15px] leading-6 text-muted-foreground'
    : 'w-4 text-[13px] leading-5 text-muted-foreground';

  while (i < tokens.length) {
    const token = tokens[i]!;
    const key = markdownTokenKey(siblingPath, token, siblingPath);

    if (token.type === 'heading_open') {
      const level = Number(token.tag.replace('h', '')) || 3;
      const inline = tokens[i + 1];
      nodes.push(
        <Text key={key} className={headingClass[level] ?? headingClass[3]}>
          {renderInline(inline?.children, key, prose)}
        </Text>
      );
      siblingPath = extendSiblingPath(siblingPath, token);
      i += 3;
      continue;
    }

    if (token.type === 'paragraph_open') {
      const inline = tokens[i + 1];
      nodes.push(
        <Text key={key} className={bodyClass}>
          {renderInline(inline?.children, key, prose)}
        </Text>
      );
      siblingPath = extendSiblingPath(siblingPath, token);
      i += 3;
      continue;
    }

    if (token.type === 'blockquote_open') {
      const close = findClosingIndex(tokens, i, 'blockquote_close');
      nodes.push(
        <View
          key={key}
          className={cn(
            'gap-2 border-l-2 border-primary/40 bg-primary/5 pl-3',
            prose ? 'rounded-r-lg py-2 pr-3' : null
          )}
        >
          {renderBlocks(tokens.slice(i + 1, close), prose)}
        </View>
      );
      siblingPath = extendSiblingPath(siblingPath, token);
      i = close + 1;
      continue;
    }

    if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') {
      const ordered = token.type === 'ordered_list_open';
      const closeType = ordered ? 'ordered_list_close' : 'bullet_list_close';
      const close = findClosingIndex(tokens, i, closeType);
      const listPath = key;
      const items: React.ReactNode[] = [];
      let j = i + 1;
      let itemSiblingPath = listPath;

      while (j < close) {
        const item = tokens[j]!;
        if (item.type !== 'list_item_open') {
          j += 1;
          continue;
        }
        const itemClose = findClosingIndex(tokens, j, 'list_item_close');
        const itemTokens = tokens.slice(j + 1, itemClose);
        const itemKey = markdownListItemKey(itemSiblingPath, itemTokens);
        itemSiblingPath = itemKey;
        const marker = ordered ? `${items.length + 1}.` : '•';
        items.push(
          <View key={itemKey} className="flex-row gap-2">
            <Text className={markerClass}>{marker}</Text>
            <View className={cn('min-w-0 flex-1', prose ? 'gap-2' : 'gap-1.5')}>
              {renderBlocks(itemTokens, prose)}
            </View>
          </View>
        );
        j = itemClose + 1;
      }

      nodes.push(
        <View key={listPath} className={prose ? 'gap-2' : 'gap-1.5'}>
          {items}
        </View>
      );
      siblingPath = extendSiblingPath(siblingPath, token);
      i = close + 1;
      continue;
    }

    if (token.type === 'fence' || token.type === 'code_block') {
      nodes.push(
        <View
          key={key}
          className={cn(
            'rounded-lg border border-border bg-muted px-3 py-2.5',
            prose && 'mt-1'
          )}
        >
          <Text className="font-mono text-[13px] leading-5 text-foreground">
            {token.content.replace(/\n$/, '')}
          </Text>
        </View>
      );
      siblingPath = extendSiblingPath(siblingPath, token);
      i += 1;
      continue;
    }

    if (token.type === 'hr') {
      nodes.push(
        <View key={key} className={cn('h-px bg-border', prose ? 'my-3' : 'my-1')} />
      );
      siblingPath = extendSiblingPath(siblingPath, token);
      i += 1;
      continue;
    }

    if (token.type === 'inline') {
      nodes.push(
        <Text key={key} className={bodyClass}>
          {renderInline(token.children, key, prose)}
        </Text>
      );
      siblingPath = extendSiblingPath(siblingPath, token);
      i += 1;
      continue;
    }

    siblingPath = extendSiblingPath(siblingPath, token);
    i += 1;
  }

  return nodes;
}

/** Locked-down markdown: no HTML/images; only http(s)/mailto via in-app browser. */
export function SecureMarkdown({
  children,
  className,
  variant = 'compact',
}: SecureMarkdownProps) {
  const source = prepareMarkdownSource(children);
  if (!source.trim()) return null;

  const prose = variant === 'prose';
  const tokens = getSafeMarkdownIt().parse(source, {});
  const blocks = renderBlocks(tokens, prose);

  return <View className={cn(prose ? 'gap-3' : 'gap-2', className)}>{blocks}</View>;
}
