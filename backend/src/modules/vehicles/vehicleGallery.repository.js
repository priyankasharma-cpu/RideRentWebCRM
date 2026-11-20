import { collection, fromDocuments, mongoOptions } from '../../config/mongoDatabase.js';

export const galleryInstalled = async () => true;

export async function listVehicleImages(db) {
  const images = await collection(db, 'vehicle_images')
    .find(
      {},
      {
        ...mongoOptions(db),
        projection: { _id: 0, vehicle_id: 1, id: 1, label: 1, url: 1, position: 1 },
      },
    )
    .sort({ vehicle_id: 1, position: 1 })
    .toArray();
  return fromDocuments(images);
}

export async function replaceVehicleImages(db, vehicleId, images) {
  await collection(db, 'vehicle_images').deleteMany({ vehicle_id: vehicleId }, mongoOptions(db));
  if (images.length) {
    await collection(db, 'vehicle_images').insertMany(
      images.map((image, position) => ({
        _id: `${vehicleId}:${image.id}`,
        vehicle_id: vehicleId,
        id: image.id,
        label: image.label,
        url: image.url,
        position,
      })),
      mongoOptions(db),
    );
    await collection(db, 'vehicles').updateOne(
      { id: vehicleId },
      { $set: { image: images[0].url } },
      mongoOptions(db),
    );
  }
}
