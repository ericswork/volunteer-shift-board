import { useRef, useState } from 'react';
import { useRemoveSignup } from '../../lib/admin';
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from '../buttons';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

type Props = { signupId: string; name: string; shiftName: string; focusAfterRemove: () => void };

export function RemoveSignupDialog({ signupId, name, shiftName, focusAfterRemove }: Props) {
  const [open, setOpen] = useState(false);
  const remove = useRemoveSignup();
  const trigger = useRef<HTMLButtonElement>(null);

  const confirm = () => {
    remove.mutate({ signupId, name, shiftName }, { onSettled: () => setOpen(false) });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        ref={trigger}
        className="ml-auto min-h-11 shrink-0 px-2 font-semibold text-error-text hover:underline"
      >
        Remove<span className="sr-only"> {name}</span>
      </DialogTrigger>
      <DialogContent
        onCloseAutoFocus={(event) => {
          // After a removal the roster refreshes without this row, so Radix would focus <body>
          if (!trigger.current) {
            event.preventDefault();
            focusAfterRemove();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            Remove {name} from {shiftName}?
          </DialogTitle>
          <DialogDescription>Their spot opens up for someone else.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose className={SECONDARY_BUTTON}>Keep</DialogClose>
          <button type="button" onClick={confirm} disabled={remove.isPending} className={PRIMARY_BUTTON}>
            {remove.isPending ? 'Removing…' : 'Remove'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
