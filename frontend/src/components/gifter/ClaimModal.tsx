import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useClaimGift } from '../../hooks/useQueries';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import toast from 'react-hot-toast';
import type { PublicGift } from '../../types';

const claimSchema = z.object({
  claimedBy: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  claimerMessage: z
    .string()
    .max(500, 'Message must be 500 characters or less')
    .optional(),
});

type ClaimFormData = z.infer<typeof claimSchema>;

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  gift: PublicGift;
  shareCode: string;
}

export const ClaimModal = ({ isOpen, onClose, gift, shareCode }: ClaimModalProps) => {
  const claimGift = useClaimGift();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClaimFormData>({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      claimedBy: '',
      claimerMessage: '',
    },
  });

  const onSubmit = async (data: ClaimFormData) => {
    try {
      await claimGift.mutateAsync({
        giftId: gift.id,
        shareCode,
        request: {
          ...data,
          claimerMessage: data.claimerMessage || undefined,
        },
      });
      toast.success('Gift claimed successfully!');
      onClose();
    } catch (error: any) {
      if (error.code === 'ALREADY_CLAIMED') {
        toast.error('This gift has already been claimed by someone else');
      } else {
        toast.error(error.message || 'Failed to claim gift');
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Claim Gift">
      <div className="mb-4 p-4 bg-background rounded-lg">
        <h4 className="font-semibold text-text-primary mb-1">{gift.title}</h4>
        <p className="text-sm text-text-secondary">{gift.description}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="claimedBy" className="block text-sm font-medium text-text-primary mb-2">
            Your Name *
          </label>
          <input
            id="claimedBy"
            type="text"
            {...register('claimedBy')}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter your name"
          />
          {errors.claimedBy && (
            <p className="mt-1 text-sm text-red-600">{errors.claimedBy.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="claimerMessage" className="block text-sm font-medium text-text-primary mb-2">
            Message (optional)
          </label>
          <textarea
            id="claimerMessage"
            {...register('claimerMessage')}
            rows={3}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Add a message for the list owner..."
          />
          {errors.claimerMessage && (
            <p className="mt-1 text-sm text-red-600">{errors.claimerMessage.message}</p>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1" loading={isSubmitting}>
            Claim Gift
          </Button>
        </div>
      </form>
    </Modal>
  );
};
