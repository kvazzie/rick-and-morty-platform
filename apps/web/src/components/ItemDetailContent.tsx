import { useItem } from '../hooks/useItem';
import type { Category, Item } from '../types';
import { ViewTransition } from 'react';
import { routesMap } from '../utils';

function isCharacter(item: Item): item is Item<'character'> {
  return 'image' in item;
}

function isLocation(item: Item): item is Item<'location'> {
  return 'dimension' in item;
}

function isEpisode(item: Item): item is Item<'episode'> {
  return 'episode' in item;
}

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-gray-700 p-3 rounded-lg">
    <p className="text-sm font-semibold text-yellow-400">{label}</p>
    <p className="text-lg text-white">{value}</p>
  </div>
);

export const ItemDetailContent = ({ category, id }: { category: Category; id: string }) => {
  const item = useItem(routesMap[category], id);

  return (
    <div className="bg-gray-800 shadow-xl rounded-lg p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      {isCharacter(item) ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <ViewTransition name={`character-image-${item.id}`}>
              <img src={item.image} alt={item.name} className="rounded-lg w-full shadow-lg" />
            </ViewTransition>
          </div>
          <div className="md:col-span-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{item.name}</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <DetailItem label="Status" value={item.status} />
              <DetailItem label="Species" value={item.species} />
              <DetailItem label="Gender" value={item.gender} />
            </div>
          </div>
        </div>
      ) : (
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center">{item.name}</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
            {isLocation(item) && (
              <>
                <DetailItem label="Type" value={item.type} />
                <DetailItem label="Dimension" value={item.dimension} />
              </>
            )}
            {isEpisode(item) && (
              <>
                <DetailItem label="Air Date" value={item.air_date} />
                <DetailItem label="Episode Code" value={item.episode} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
