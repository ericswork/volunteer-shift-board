import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useAddShift, type AdminEvent } from '../../lib/admin';
import { shiftFormSchema, type ShiftForm } from '../../lib/admin-forms';
import { ApiError } from '../../lib/api';
import { showServerError } from '../../lib/signups';
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from '../buttons';
import { SelectField } from '../SelectField';
import { TextField } from '../TextField';

type Props = { events: AdminEvent[]; eventId: string; onEventChange: (eventId: string) => void };

// The Event field is the page's selected event, so it isn't form state and survives reset()
export function AddShiftForm({ events, eventId, onEventChange }: Props) {
  const addShift = useAddShift();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    getValues,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(shiftFormSchema),
    mode: 'onBlur',
    defaultValues: { name: '', startTime: '', endTime: '' },
  });

  const submit = (shift: ShiftForm) =>
    addShift.mutate(
      { eventId, shift },
      {
        onSuccess: () => reset(),
        onError: (error) => {
          if (error instanceof ApiError && error.details?.length) {
            for (const { path, message } of error.details) {
              setError(path === 'eventId' ? 'root.eventId' : (path as keyof ShiftForm), { message });
            }
          } else {
            showServerError(error);
          }
        },
      },
    );

  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="shift-event"
          label="Event"
          value={eventId}
          error={errors.root?.eventId?.message}
          onChange={(e) => {
            clearErrors('root.eventId');
            onEventChange(e.target.value);
          }}
        >
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </SelectField>
        <TextField id="shift-name" label="Shift name" error={errors.name?.message} {...register('name')} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          id="shift-start"
          label="Start time"
          type="time"
          error={errors.startTime?.message}
          {...register('startTime', {
            // Re-check End only once it has a value, so it never complains before the user gets there
            onBlur: () => {
              if (getValues('endTime')) void trigger('endTime');
            },
          })}
        />
        <TextField
          id="shift-end"
          label="End time"
          type="time"
          error={errors.endTime?.message}
          {...register('endTime')}
        />
        <TextField
          id="shift-capacity"
          label="Capacity"
          type="number"
          inputMode="numeric"
          error={errors.capacity?.message}
          {...register('capacity', { valueAsNumber: true })}
        />
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button type="submit" disabled={addShift.isPending} className={PRIMARY_BUTTON}>
          {addShift.isPending ? 'Adding…' : 'Add shift'}
        </button>
        <button type="button" onClick={() => reset()} className={SECONDARY_BUTTON}>
          Cancel
        </button>
      </div>
    </form>
  );
}
