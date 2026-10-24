import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@eduos/ui';

export function CopyId({ value }: { value: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState('copied');
    } catch {
      setState('failed');
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="break-all font-mono text-xs">{value}</code>
      <Button
        variant="outline"
        size="icon"
        aria-label="Copy account or institution ID"
        onClick={() => {
          void copy();
        }}
      >
        {state === 'copied' ? (
          <Check aria-hidden="true" className="size-4 text-primary" />
        ) : (
          <Copy aria-hidden="true" className="size-4" />
        )}
      </Button>
      <output className="text-xs text-muted-foreground">
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy unavailable' : ''}
      </output>
    </div>
  );
}
