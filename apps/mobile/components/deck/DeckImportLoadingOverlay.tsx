import { AppLoadingOverlay } from '@/components/ui/app-loader';

interface DeckImportLoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function DeckImportLoadingOverlay({
  visible,
  message: _message,
}: DeckImportLoadingOverlayProps) {
  return <AppLoadingOverlay visible={visible} />;
}
