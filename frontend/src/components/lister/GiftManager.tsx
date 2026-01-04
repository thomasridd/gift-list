import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useList, useGifts, useDeleteGift, useUnclaimGift } from '../../hooks/useQueries';
import { Layout } from '../common/Layout';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { GiftForm } from './GiftForm';
import { ListForm } from './ListForm';
import toast from 'react-hot-toast';
import { TrashIcon, PencilIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import type { Gift } from '../../types';

export const GiftManager = () => {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const [showCreateGift, setShowCreateGift] = useState(false);
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  const [editingList, setEditingList] = useState(false);

  const { data: list, isLoading: listLoading } = useList(listId!);
  const { data: gifts, isLoading: giftsLoading } = useGifts(listId!);
  const deleteGift = useDeleteGift();
  const unclaimGift = useUnclaimGift();

  const handleDeleteGift = async (giftId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await deleteGift.mutateAsync({ giftId, listId: listId! });
      toast.success('Gift deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete gift');
    }
  };

  const handleUnclaim = async (giftId: string) => {
    if (!window.confirm('Are you sure you want to unclaim this gift?')) {
      return;
    }

    try {
      await unclaimGift.mutateAsync({ giftId, listId: listId! });
      toast.success('Gift unclaimed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to unclaim gift');
    }
  };

  const copyShareUrl = () => {
    if (list) {
      const fullUrl = `${window.location.origin}${list.shareUrl}`;
      navigator.clipboard.writeText(fullUrl);
      toast.success('Share URL copied to clipboard!');
    }
  };

  const sortedGifts = gifts ? [...gifts].sort((a, b) => a.sortOrder - b.sortOrder) : [];

  if (listLoading || giftsLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!list) {
    return (
      <Layout>
        <Card>
          <p className="text-center text-text-secondary">List not found</p>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeftIcon className="w-4 h-4 mr-2 inline" />
          Back to Dashboard
        </Button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">{list.title}</h1>
            <p className="text-text-secondary mt-1">
              {sortedGifts.length} gifts • {sortedGifts.filter(g => g.status === 'claimed').length} claimed
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={copyShareUrl}>
              Copy Share URL
            </Button>
            <Button variant="ghost" onClick={() => setEditingList(true)}>
              <PencilIcon className="w-4 h-4 mr-2 inline" />
              Edit List
            </Button>
            <Button onClick={() => setShowCreateGift(true)}>
              Add Gift
            </Button>
          </div>
        </div>
      </div>

      {sortedGifts.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🎁</span>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No gifts yet
            </h3>
            <p className="text-text-secondary mb-4">
              Add your first gift to this list!
            </p>
            <Button onClick={() => setShowCreateGift(true)}>
              Add Your First Gift
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedGifts.map((gift) => (
            <Card key={gift.id}>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-text-primary">
                      {gift.title}
                      {gift.status === 'claimed' && (
                        <span className="ml-2 text-sm bg-accent text-white px-2 py-1 rounded">
                          Claimed
                        </span>
                      )}
                    </h3>
                  </div>

                  <p className="text-text-secondary mb-2">{gift.description}</p>

                  {gift.url && (
                    <a
                      href={gift.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      View Product →
                    </a>
                  )}

                  {gift.status === 'claimed' && (
                    <div className="mt-3 p-3 bg-background rounded-lg">
                      <p className="text-sm font-medium text-text-primary">
                        Claimed by: {gift.claimedBy}
                      </p>
                      {gift.claimerMessage && (
                        <p className="text-sm text-text-secondary mt-1">
                          Message: {gift.claimerMessage}
                        </p>
                      )}
                      <p className="text-xs text-text-secondary mt-1">
                        {new Date(gift.claimedAt!).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Button variant="ghost" onClick={() => setEditingGift(gift)}>
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                  {gift.status === 'claimed' && (
                    <Button variant="secondary" onClick={() => handleUnclaim(gift.id)}>
                      Unclaim
                    </Button>
                  )}
                  <Button variant="danger" onClick={() => handleDeleteGift(gift.id, gift.title)}>
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreateGift && (
        <GiftForm
          isOpen={showCreateGift}
          onClose={() => setShowCreateGift(false)}
          listId={listId!}
          nextSortOrder={sortedGifts.length}
        />
      )}

      {editingGift && (
        <GiftForm
          isOpen={!!editingGift}
          onClose={() => setEditingGift(null)}
          listId={listId!}
          gift={editingGift}
        />
      )}

      {editingList && list && (
        <ListForm
          isOpen={editingList}
          onClose={() => setEditingList(false)}
          list={list}
        />
      )}
    </Layout>
  );
};
