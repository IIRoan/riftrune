import { useState } from 'react';
import type { TextStyle } from 'react-native';
import { View } from 'react-native';
import { Button, ButtonText } from '@/components/ui/button';
import { CardRulesText } from '@/components/riftbound/CardRulesText';

interface ExpandableTextProps {
  text: string;
  initialLines?: number;
  style?: TextStyle;
}

export function ExpandableText({ text, initialLines = 4, style }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const showToggle = text.length > 100;

  return (
    <View>
      <CardRulesText
        text={text}
        style={style}
        numberOfLines={expanded ? undefined : initialLines}
      />
      {showToggle ? (
        <Button
          variant="link"
          size="sm"
          className="mt-1 h-auto self-start p-0"
          onPress={() => {
            setExpanded((v) => !v);
          }}
        >
          <ButtonText className="text-xs text-muted-foreground">
            {expanded ? '▲ Tap to collapse' : '▼ Tap to expand'}
          </ButtonText>
        </Button>
      ) : null}
    </View>
  );
}
