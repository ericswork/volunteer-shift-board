import { useState } from 'react';
import { formatDate } from '../lib/format';
import { useCancelSignup } from '../lib/signups';
import { cn } from '../lib/utils';
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from './buttons';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

type Props = { signupId: string; shiftName: string; startsAt: string; className?: string };

export function CancelSignupDialog({ signupId, shiftName, startsAt, className }: Props) {
  const [open, setOpen] = useState(false);
  const cancel = useCancelSignup();

  const confirm = () => {
    cancel.mutate({ signupId, shiftName }, { onSettled: () => setOpen(false) });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(SECONDARY_BUTTON, className)}>Cancel sign-up</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Cancel your {shiftName} shift on {formatDate(startsAt)}?
          </DialogTitle>
          <DialogDescription>Your spot opens up for someone else.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose className={SECONDARY_BUTTON}>Keep my spot</DialogClose>
          <button type="button" onClick={confirm} disabled={cancel.isPending} className={PRIMARY_BUTTON}>
            {cancel.isPending ? 'Cancelling…' : 'Yes, cancel'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
