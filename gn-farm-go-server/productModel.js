"use strict";
const mongoose = require("mongoose");
const slugify = require("slugify"); // Erase if already required
const COLLECTION_NAME_PRODUCT = "products";
const DOCUMENT_NAME_PRODUCT = "productModel";
const COLLECTION_NAME_VAGETABLES = "vegetables";
const DOCUMENT_NAME_MUSHROOM = "mushroomModel";
const COLLECTION_NAME_MUSHROOMS = "mushrooms";

const DOCUMENT_NAME_VEGETABLE = "vegetableModel";
const COLLECTION_NAME_BONSAIS = "bonsais";
const DOCUMENT_NAME_BONSAI = "bonsaiModel";

// Declare the Schema of the Mongo model
const productSchema = new mongoose.Schema(
  {
    product_name: {
      type: String,
      required: true,
      trim: true,
      maxLength: 150,
    },
    product_price: {
      type: Number,
      required: true,
    },
    product_status: {
      type: Number,
      default: 1, // Sản phẩm mới đang ở trạng thái đang mở
    },
    product_thumb: {
      type: String,
      required: true,
      trim: true,
    },
    product_pictures: {
      type: Array,
      required: true,
      default: [],
    },
    product_videos: {
      type: Array,
      default: [],
    },

    product_ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be above 5.0"],
    },
    product_variations: { type: Array, default: [] },
    product_description: { type: String },
    product_slug: { type: String },
    product_quantity: {
      type: Number,
      default: null, // Giá trị mặc định là null
      validate: {
        validator: function (v) {
          return v === null || typeof v === "number"; // Kiểm tra nếu là null hoặc number
        },
        message: (props) => `${props.value} không phải là số hoặc null!`,
      },
    },
    product_type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "categoryModel",
      required: true,
    },
    sub_product_type: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "subCategoryModel",
      default: [],
    },

    discount: {
      type: Number,
      default: 0,
    },
    product_discountedPrice: {
      type: Number,
      required: true,
    },
    product_selled: {
      type: Number,
      default: 0,
    },
    product_attributes: { type: mongoose.Schema.Types.Mixed, required: true },
    isDraft: { type: Boolean, default: false, index: true, select: false },
    isPublished: { type: Boolean, default: true, index: true, select: false },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME_PRODUCT,
  }
);
productSchema.index({ isPublished: 1, product_type: 1 });
productSchema.index({ product_name: "text", product_description: "text" });
//middleware runs before save() and create().....
productSchema.pre("save", function (next) {
  this.product_slug = slugify(this.product_name, { lower: true });
  next();
});

// productSchema.pre("save", function (next) {
//   if (this.discount) {
//     // Giảm giá theo %
//     this.product_discountedPrice =
//       this.product_price - (this.product_price * this.discount) / 100;
//   } else {
//     this.product_discountedPrice = this.product_price; // Không có discount
//   }
//   next();
// });

// // Middleware tính giá sau giảm khi update
// productSchema.pre("findOneAndUpdate", function (next) {
//   const update = this.getUpdate();

//   const product_price = update.product_price || this.getQuery().product_price;
//   const discount = update.discount || this.getQuery().discount;
//   if (discount) {
//     // Giảm giá theo %
//     update.product_discountedPrice =
//       product_price - (product_price * discount) / 100;

//     // Giảm giá cố định
//   } else {
//     update.product_discountedPrice = this.product_price; // Không giảm giá
//   }

//   next();
// });

const mushroomSchema = new mongoose.Schema(
  {
    product_shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "shopModel",
      required: true,
    },
    brand: {
      type: String,
      trim: true,
      maxLength: 150,
    },
    size: {
      type: String,
      trim: true,
    },
    material: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME_MUSHROOMS,
  }
);
const vegetablesSchema = new mongoose.Schema(
  {
    product_shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "shopModel",
      required: true,
    },
    manufacturer: {
      type: String,
      trim: true,
      maxLength: 150,
    },
    model: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME_VAGETABLES,
  }
);

const bonsaiSchema = new mongoose.Schema(
  {
    brand: {
      type: String,
      trim: true,
      maxLength: 150,
    },
    size: {
      type: String,
      trim: true,
    },
    material: {
      type: String,
      trim: true,
    },
    product_shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "shopModel",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME_BONSAIS,
  }
);

//Export the model
module.exports = {
  productModel: mongoose.model(DOCUMENT_NAME_PRODUCT, productSchema),
  mushroomModel: mongoose.model(DOCUMENT_NAME_MUSHROOM, mushroomSchema),
  vegetableModel: mongoose.model(DOCUMENT_NAME_VEGETABLE, vegetablesSchema),
  bonsaiModel: mongoose.model(DOCUMENT_NAME_BONSAI, bonsaiSchema),
};
