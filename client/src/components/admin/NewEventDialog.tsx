import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateEvent } from '../../lib/admin';
import { eventFormSchema, type EventForm } from '../../lib/admin-forms';
import { ApiError } from '../../lib/api';
import { CAUSE_LABELS } from '../../lib/events';
import { appToday } from '../../lib/format';
import { showServerError } from '../../lib/signups';
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from '../buttons';
import { SelectField } from '../SelectField';
import { TextAreaField } from '../TextAreaField';
import { TextField } from '../TextField';
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

export function NewEventDialog({ onCreated }: { onCreated: (eventId: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={`${PRIMARY_BUTTON} gap-2`}>
        <Plus aria-hidden className="size-5" />
        New event
      </DialogTrigger>
      {/* Scrolls inside the viewport on short phone screens */}
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New event</DialogTitle>
          <DialogDescription>It starts with no shifts. Add them once it's created.</DialogDescription>
        </DialogHeader>
        {/* Radix unmounts the content on close, so every opening starts with an empty form */}
        <NewEventForm
          onCreated={(eventId) => {
            setOpen(false);
            onCreated(eventId);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function NewEventForm({ onCreated }: { onCreated: (eventId: string) => void }) {
  const createEvent = useCreateEvent();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(eventFormSchema),
    mode: 'onBlur',
    defaultValues: { title: '', date: '', location: '', description: '' },
  });

  const submit = (event: EventForm) =>
    createEvent.mutate(event, {
      onSuccess: ({ id }) => onCreated(id),
      onError: (error) => {
        if (error instanceof ApiError && error.details?.length) {
          for (const { path, message } of error.details) {
            setError(path as keyof EventForm, { message });
          }
        } else {
          showServerError(error);
        }
      },
    });

  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="space-y-4">
      <TextField id="event-title" label="Title" error={errors.title?.message} {...register('title')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField id="event-cause" label="Cause" error={errors.cause?.message} {...register('cause')}>
          <option value="">Choose a cause</option>
          {Object.entries(CAUSE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <TextField
          id="event-date"
          label="Date"
          type="date"
          min={appToday()}
          error={errors.date?.message}
          {...register('date')}
        />
      </div>
      <TextField
        id="event-location"
        label="Location"
        error={errors.location?.message}
        {...register('location')}
      />
      <TextAreaField
        id="event-description"
        label="Description"
        rows={4}
        error={errors.description?.message}
        {...register('description')}
      />
      <DialogFooter className="pt-2">
        <DialogClose className={SECONDARY_BUTTON}>Cancel</DialogClose>
        <button type="submit" disabled={createEvent.isPending} className={PRIMARY_BUTTON}>
          {createEvent.isPending ? 'Creating…' : 'Create event'}
        </button>
      </DialogFooter>
    </form>
  );
}
