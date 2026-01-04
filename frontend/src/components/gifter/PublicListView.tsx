import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePublicList, usePublicGifts } from '../../hooks/useQueries';
import { Layout } from '../common/Layout';
import { Card } from '../common/Card';
import { ClaimModal } from './ClaimModal';
import type { PublicGift } from '../../types';

export const PublicListView = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const [claimingGift, setClaimingGift] = useState<PublicGift | null>(null);

  const { data: list, isLoading: listLoading } = usePublicList(shareCode!);
  const { data: gifts, isLoading: giftsLoading } = usePublicGifts(shareCode!);

  if (listLoading || giftsLoading) {
    return (
      <Layout showNav={false}>
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading gift list...</p>
        </div>
      </Layout>
    );
  }

  if (!list) {
    return (
      <Layout showNav={false}>
        <Card>
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">❌</span>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              List Not Found
            </h3>
            <p className="text-text-secondary">
              This gift list doesn't exist or the link is invalid.
            </p>
          </div>
        </Card>
      </Layout>
    );
  }

  const availableGifts = gifts?.filter(g => g.status === 'available') || [];
  const claimedGifts = gifts?.filter(g => g.status === 'claimed') || [];

  return (
    <Layout showNav={false}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2 flex items-center justify-center gap-2">
            <span>🎁</span>
            {list.title}
          </h1>
          <p className="text-text-secondary">
            Choose a gift to claim for this person!
          </p>
        </div>

        {availableGifts.length === 0 && claimedGifts.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">🎄</span>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No gifts yet
              </h3>
              <p className="text-text-secondary">
                Check back later when gifts are added!
              </p>
            </div>
          </Card>
        )}

        {availableGifts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">
              Available Gifts ({availableGifts.length})
            </h2>
            <div className="space-y-4">
              {availableGifts.map((gift) => (
                <Card key={gift.id} hover>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text-primary mb-2">
                        {gift.title}
                      </h3>
                      <p className="text-text-secondary mb-3">{gift.description}</p>
                      {gift.url && (
                        <a
                          href={gift.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm inline-block"
                        >
                          View Product →
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => setClaimingGift(gift)}
                      className="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors font-medium whitespace-nowrap"
                    >
                      Claim Gift
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!list.hideClaimedGifts && claimedGifts.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-text-primary mb-4">
              Already Claimed ({claimedGifts.length})
            </h2>
            <div className="space-y-4">
              {claimedGifts.map((gift) => (
                <Card key={gift.id} className="opacity-60">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text-primary mb-2">
                        {gift.title}
                        <span className="ml-2 text-sm bg-gray-400 text-white px-2 py-1 rounded">
                          Claimed
                        </span>
                      </h3>
                      <p className="text-text-secondary">{gift.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {availableGifts.length === 0 && claimedGifts.length > 0 && list.hideClaimedGifts && (
          <Card>
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">✨</span>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                All gifts have been claimed!
              </h3>
              <p className="text-text-secondary">
                Thank you for visiting. All available gifts have been claimed.
              </p>
            </div>
          </Card>
        )}

        {claimingGift && (
          <ClaimModal
            isOpen={!!claimingGift}
            onClose={() => setClaimingGift(null)}
            gift={claimingGift}
            shareCode={shareCode!}
          />
        )}
      </div>
    </Layout>
  );
};
