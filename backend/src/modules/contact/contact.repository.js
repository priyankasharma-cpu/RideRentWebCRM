import {
  collection,
  fromDocument,
  fromDocuments,
  mongoOptions,
} from '../../config/mongoDatabase.js';

export const inquiriesInstalled = async () => true;

export async function findSubmission(db, key) {
  return fromDocument(
    await collection(db, 'contact_inquiries').findOne({ submission_key: key }, mongoOptions(db)),
  );
}

export async function findInquiry(db, id) {
  return fromDocument(await collection(db, 'contact_inquiries').findOne({ id }, mongoOptions(db)));
}

export async function insertInquiry(db, record, input, time) {
  const document = {
    _id: record,
    id: record,
    submission_key: input.submissionKey,
    name: input.name,
    email: input.email,
    phone: input.phone,
    inquiry_type: input.inquiryType,
    message: input.message,
    status: 'new',
    created_at: time,
    updated_at: time,
  };
  return collection(db, 'contact_inquiries').insertOne(document, mongoOptions(db));
}

export async function listInquiries(db, status, offset) {
  const filter = status === 'all' ? {} : { status };
  const [items, total] = await Promise.all([
    collection(db, 'contact_inquiries')
      .find(filter, mongoOptions(db))
      .project({
        _id: 0,
        id: 1,
        name: 1,
        email: 1,
        phone: 1,
        inquiry_type: 1,
        message: 1,
        status: 1,
        created_at: 1,
        updated_at: 1,
      })
      .sort({ created_at: -1, id: -1 })
      .skip(offset)
      .limit(50)
      .toArray(),
    collection(db, 'contact_inquiries').countDocuments(filter, mongoOptions(db)),
  ]);
  return { items: fromDocuments(items), total, limit: 50, offset };
}

export async function updateInquiryStatus(db, id, status, time) {
  return collection(db, 'contact_inquiries').updateOne(
    { id },
    { $set: { status, updated_at: time } },
    mongoOptions(db),
  );
}
