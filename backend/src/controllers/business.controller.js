const {
  createBusiness,
  getMyBusinesses,
  getBusinessById,
  updateBusiness,
  deleteBusiness,
} = require("../services/business.service");
const { getAllCountries, getCurrencyForCountry } = require("../utils/currencies");
const { sendSuccess } = require("../utils/response.utils");
const asyncHandler = require("../utils/asyncHandler");

/**
 * POST /api/businesses
 * Create a new business (SuperAdmin only)
 */
const create = asyncHandler(async (req, res) => {
  const { name, phone, email, country, location } = req.body;

  const business = await createBusiness({
    name,
    phone,
    email,
    country,
    location,
    ownerId: req.user.id,
  });

  return sendSuccess(res, {
    message: "Business created successfully",
    data: business,
    statusCode: 201,
  });
});

/**
 * GET /api/businesses
 * Get all businesses for logged in SuperAdmin
 */
const getAll = asyncHandler(async (req, res) => {
  const businesses = await getMyBusinesses(req.user.id);

  return sendSuccess(res, {
    message: "Businesses fetched successfully",
    data: businesses,
  });
});

/**
 * GET /api/businesses/:id
 * Get a single business
 */
const getOne = asyncHandler(async (req, res) => {
  const business = await getBusinessById(
    req.params.id,
    req.user.id,
    req.user.role
  );

  return sendSuccess(res, {
    message: "Business fetched successfully",
    data: business,
  });
});

/**
 * PATCH /api/businesses/:id
 * Update a business (SuperAdmin only)
 */
const update = asyncHandler(async (req, res) => {
  const { name, phone, email, location } = req.body;

  const business = await updateBusiness(
    req.params.id,
    req.user.id,
    { name, phone, email, location }
  );

  return sendSuccess(res, {
    message: "Business updated successfully",
    data: business,
  });
});

/**
 * DELETE /api/businesses/:id
 * Delete a business (SuperAdmin, owner only)
 */
const remove = asyncHandler(async (req, res) => {
  const result = await deleteBusiness(req.params.id, req.user.id);

  return sendSuccess(res, {
    message: result.message,
  });
});

/**
 * GET /api/countries
 * Get all countries and their currencies (for dropdown on frontend)
 */
const getCountries = asyncHandler(async (req, res) => {
  const countries = getAllCountries();

  const countriesWithCurrency = countries.map((country) => ({
    country,
    currency: getCurrencyForCountry(country),
  }));

  return sendSuccess(res, {
    message: "Countries fetched successfully",
    data: countriesWithCurrency,
  });
});

module.exports = { create, getAll, getOne, update, remove, getCountries };
