import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLists, useDeleteList } from '../../hooks/useQueries';
import { Layout } from '../common/Layout';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { ListForm } from './ListForm';
import toast from 'react-hot-toast';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

export const Dashboard = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data: lists, isLoading } = useLists();
  const deleteList = useDeleteList();
  const navigate = useNavigate();

  const handleDelete = async (listId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will delete all gifts in the list.`)) {
      return;
    }

    try {
      await deleteList.mutateAsync(listId);
      toast.success('List deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete list');
    }
  };

  const copyShareUrl = (shareUrl: string) => {
    const fullUrl = `${window.location.origin}${shareUrl}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success('Share URL copied to clipboard!');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading your lists...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">My Gift Lists</h1>
            <p className="text-text-secondary mt-1">
              Create and manage your Christmas gift lists
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            Create New List
          </Button>
        </div>
      </div>

      {lists && lists.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🎁</span>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No lists yet
            </h3>
            <p className="text-text-secondary mb-4">
              Create your first gift list to get started!
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create Your First List
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lists?.map((list) => (
            <Card key={list.id} hover>
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    {list.title}
                  </h3>
                  <div className="space-y-1 text-sm text-text-secondary mb-4">
                    <p>Total Gifts: {list.giftCount || 0}</p>
                    <p>Claimed: {list.claimedCount || 0}</p>
                    <p className="text-xs">
                      Updated: {new Date(list.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => copyShareUrl(list.shareUrl)}
                  >
                    Copy Share URL
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={() => navigate(`/lists/${list.id}`)}
                    >
                      <PencilIcon className="w-4 h-4 mr-1 inline" />
                      Manage
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(list.id, list.title)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreateModal && (
        <ListForm
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </Layout>
  );
};
