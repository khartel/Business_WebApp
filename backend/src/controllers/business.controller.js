const {
  createBusiness,
  getMyBusinesses,
  getBusinessById,
  updateBusiness,
} = require("../services/business.service");
const { getAllCountries, getCurrencyForCountry } = require("../utils/currencies");
const { sendSuccess, sendError } = require("../utils/response.utils");

/**
 * POST /api/businesses
 * Create a new business (SuperAdmin only)
 */
const create = async (req, res) => {
  try {
    const { name, phone, email, country, location } = req.body;

    if (!name || !phone || !country || !location) {
      return sendError(res, {
        message: "Business name, phone, country and location are required",
        statusCode: 400,
      });
    }

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
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not create business",
      statusCode: 400,
    });
  }
};

/**
 * GET /api/businesses
 * Get all businesses for logged in SuperAdmin
 */
const getAll = async (req, res) => {
  try {
    const businesses = await getMyBusinesses(req.user.id);

    return sendSuccess(res, {
      message: "Businesses fetched successfully",
      data: businesses,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not fetch businesses",
      statusCode: 400,
    });
  }
};

/**
 * GET /api/businesses/:id
 * Get a single business
 */
const getOne = async (req, res) => {
  try {
    const business = await getBusinessById(
      req.params.id,
      req.user.id,
      req.user.role
    );

    return sendSuccess(res, {
      message: "Business fetched successfully",
      data: business,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not fetch business",
      statusCode: 404,
    });
  }
};

/**
 * PATCH /api/businesses/:id
 * Update a business (SuperAdmin only)
 */
const update = async (req, res) => {
  try {
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
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not update business",
      statusCode: 400,
    });
  }
};

/**
 * GET /api/countries
 * Get all countries and their currencies (for dropdown on frontend)
 */
const getCountries = async (req, res) => {
  try {
    const countries = getAllCountries();

    const countriesWithCurrency = countries.map((country) => ({
      country,
      currency: getCurrencyForCountry(country),
    }));

    return sendSuccess(res, {
      message: "Countries fetched successfully",
      data: countriesWithCurrency,
    });
  } catch (error) {
    return sendError(res, {
      message: "Could not fetch countries",
      statusCode: 500,
    });
  }
};

module.exports = { create, getAll, getOne, update, getCountries };