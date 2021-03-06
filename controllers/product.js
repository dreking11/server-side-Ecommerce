const Product = require('../models/product');
const slugify = require('slugify');

exports.create = async(req,res) => {
    try {
        req.body.slug = slugify(req.body.title);
        const newProduct = await new Product(req.body).save()
        res.json(newProduct);
        //console.log(req.body);
    }catch(err) {
        //console.log(err);
        //res.status(400).send("Create Product failed");
        res.status(400).json({
            err: err.message,
        });
    }
};


exports.listAll = async (req,res) => {
    let products = await Product.find({})
    .limit(parseInt(req.params.count))
    .populate('category')
    .populate('subs')
    .sort([['createdAt', 'desc']])
    .exec();
    res.json(products);
};
exports.remove = async (req,res) => {
    try {
        const deleted = await Product.findOneAndRemove({slug: req.params.slug, }).exec();
        res.json(deleted)
    } catch (err) {
        res.status(400).send('Product delete Fail');
    }
};
exports.read = async (req,res) => {
    const product = await Product.findOne({slug: req.params.slug})
    .populate("category")
    .populate("subs")
    .exec();
    res.json(product);
};

exports.update = async (req,res) => {
    try {
      if (req.body.title) {
          req.body.slug = slugify(req.body.title);
      }  
      const updated = await Product.findOneAndUpdate({slug: req.params.slug}, req.body, {new:true})
      .exec();
      res.json(updated);
    } catch (err) {
        console.log('PRODUCT UPDATE ERROR --->', err)
        //return res.status(400).send('Product update failed')
        res.status(400).json({
            err: err.message,
        });
    }
}

// WITHOUT PAGNATION
// exports.list = async (req,res) => {
//     try {
//       const {sort,order,limit} = req.body
//       const products = await Product.find({})
//       .populate('category')
//       .populate('subs')
//       .sort([[sort, order]])
//       .limit(limit)
//       .exec();

//       res.json(products);
//     } catch (err) {
//         console.log(err)
//     }
// };

exports.list = async (req,res) => {
    try {
      const {sort,order,page} = req.body;
      const currentPage = page || 1
      const perPage = 3

      const products = await Product.find({})
      .skip((currentPage - 1) * perPage)
      .populate('category')
      .populate('subs')
      .sort([[sort, order]])
      .limit(perPage)
      .exec();

      res.json(products);
    } catch (err) {
        console.log(err)
    }
};
exports.productsCount = async (req,res) => {
    let total = await Product.find({})
    .estimatedDocumentCount()
    .exec();
    res.json(total);
};

exports.productStar = async (req, res) => {
  const product = await Product.findById(req.params.productId).exec();
  const user = await User.finOne({ email: req.user.email }).exec();
  const { star } = req.body;

  let existingRatingObject = product.ratings.find(
    (ele) => ele.postedBy == user._id
  );

  if (existingRatingObject === undefined) {
    let ratingAdded = await Product.findByIdAndUpdate(
      product._id,
      {
        $push: { ratings: { star: star, postedBy: user._id } },
      },
      { new: true }
    ).exec();
    res.json(ratingAdded);
  } else {
    const ratingUpdated = await Product.updateOne({
      ratings: { $eleMatch: existingRatingObject },
    }, 
    {$set: {"ratings.$.star": star}},
    {new: true}
    ).exec();
    res.json(ratingUpdated);
  }
};