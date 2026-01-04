import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateGift, useUpdateGift } from '../../hooks/useQueries';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import toast from 'react-hot-toast';
import type { Gift } from '../../types';

const giftSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().max(2000, 'Description must be 2000 characters or less').optional(),
  url: z.string().url('Must be a valid URL').max(2000).optional().or(z.literal('')),
});

type GiftFormData = z.infer<typeof giftSchema>;

interface GiftFormProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  gift?: Gift;
  nextSortOrder?: number;
}

export const GiftForm = ({ isOpen, onClose, listId, gift, nextSortOrder = 0 }: GiftFormProps) => {
  const createGift = useCreateGift();
  const updateGift = useUpdateGift();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GiftFormData>({
    resolver: zodResolver(giftSchema),
    defaultValues: {
      title: gift?.title || '',
      description: gift?.description || '',
      url: gift?.url || '',
    },
  });

  const onSubmit = async (data: GiftFormData) => {
    try {
      if (gift) {
        await updateGift.mutateAsync({
          giftId: gift.id,
          listId,
          request: {
            ...data,
            url: data.url || undefined,
            description: data.description || '',
          },
        });
        toast.success('Gift updated successfully!');
      } else {
        await createGift.mutateAsync({
          listId,
          request: {
            ...data,
            url: data.url || undefined,
            description: data.description || '',
            sortOrder: nextSortOrder,
          },
        });
        toast.success('Gift added successfully!');
      }
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save gift');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={gift ? 'Edit Gift' : 'Add New Gift'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-text-primary mb-2">
            Gift Title *
          </label>
          <input
            id="title"
            type="text"
            {...register('title')}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g., LEGO Star Wars Millennium Falcon"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-text-primary mb-2">
            Description
          </label>
          <textarea
            id="description"
            {...register('description')}
            rows={4}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Add details about the gift..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-medium text-text-primary mb-2">
            Product URL (optional)
          </label>
          <input
            id="url"
            type="url"
            {...register('url')}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="https://example.com/product"
          />
          {errors.url && (
            <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={isSubmitting}>
            {gift ? 'Update' : 'Add Gift'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
