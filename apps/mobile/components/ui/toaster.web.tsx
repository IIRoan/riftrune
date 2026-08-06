import { Toaster as SonnerToaster, type ToasterProps } from 'sonner';
import { useUniwind } from 'uniwind';

export const Toaster = (props: Omit<ToasterProps, 'theme'>) => {
  const { theme: uniwindTheme } = useUniwind();
  const theme = uniwindTheme === 'dark' ? 'dark' : 'light';

  return (
    <SonnerToaster
      closeButton
      duration={3_500}
      gap={8}
      offset={12}
      position="bottom-right"
      visibleToasts={3}
      toastOptions={{
        classNames: {
          content: 'gap-3',
          description: 'text-muted-foreground text-[13px] leading-snug',
          toast:
            'w-auto max-w-sm rounded-xl border border-border bg-card px-3.5 py-3 shadow-lg shadow-black/25',
          title: 'text-sm font-medium leading-5 text-foreground',
        },
      }}
      {...props}
      theme={theme}
    />
  );
};
