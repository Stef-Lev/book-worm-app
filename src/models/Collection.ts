import mongoose, { InferSchemaType, Model } from "mongoose";

const collectionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, maxlength: 50 },
  },
  { timestamps: true }
);

collectionSchema.index({ userId: 1, name: 1 }, { unique: true });

export type CollectionDoc = InferSchemaType<typeof collectionSchema>;

export default (mongoose.models.Collection as Model<CollectionDoc>) ||
  mongoose.model<CollectionDoc>("Collection", collectionSchema);
