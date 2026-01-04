import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateList, useUpdateList } from '../../hooks/useQueries';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import toast from 'react-hot-toast';
import type { List } from '../../types';

const listSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  hideClaimedGifts: z.boolean(),
});

type ListFormData = z.infer<typeof listSchema>;

interface ListFormProps {
  isOpen: boolean;
  onClose: () => void;
  list?: List;
}

export const ListForm = ({ isOpen, onClose, list }: ListFormProps) => {
  const createList = useCreateList();
  const updateList = useUpdateList();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ListFormData>({
    resolver: zodResolver(listSchema),
    defaultValues: {
      title: list?.title || '',
      hideClaimedGifts: list?.hideClaimedGifts ?? true,
    },
  });

  const onSubmit = async (data: ListFormData) => {
    try {
      if (list) {
        await updateList.mutateAsync({ listId: list.id, request: data });
        toast.success('List updated successfully!');
      } else {
        await createList.mutateAsync(data);
        toast.success('List created successfully!');
      }
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save list');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={list ? 'Edit List' : 'Create New List'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-text-primary mb-2">
            List Title
          </label>
          <input
            id="title"
            type="text"
            {...register('title')}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g., Emma's Christmas 2024"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            id="hideClaimedGifts"
            type="checkbox"
            {...register('hideClaimedGifts')}
            className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
          />
          <label htmlFor="hideClaimedGifts" className="text-sm text-text-primary">
            Hide claimed gifts from gifters
          </label>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={isSubmitting}>
            {list ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
