
"use server";

import { z } from "zod";
import axios from 'axios';
import { revalidatePath } from 'next/cache';

const ScrapeSchema = z.object({
  country: z.string().min(1, "Country is required."),
  country_name: z.string().min(1, "Country name is required."),
  state: z.string().optional(),
  city: z.string().optional(),
  businessType: z.string().min(1, "Business type is required."),
  provider: z.enum(['google-maps', 'serpapi']),
  apiKey: z.string().min(1, "API Key is required."),
});

// Helper functions for scraping
async function scrapeWithSerpApi(apiKey: string, query: string, location: string) {
  const params = {
    api_key: apiKey,
    engine: 'google_maps',
    q: query,
    location: location,
    hl: 'en',
  };

  const response = await axios.get('https://serpapi.com/search.json', { params });

  if (response.data && response.data.local_results) {
    return response.data.local_results.map((item: any) => ({
      name: item.title,
      address: item.address,
      phone: item.phone,
      category: item.type,
    }));
  }
  return [];
}

async function scrapeWithGoogleMaps(apiKey: string, query: string, location: string) {
  const textQuery = `${query} in ${location}`;
  const fields = 'places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.primaryType';
  const url = `https://places.googleapis.com/v1/places:searchText`;

  const response = await axios.post(url, 
    {
      textQuery: textQuery,
      languageCode: 'en',
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fields,
      },
    }
  );

  if (response.data && response.data.places) {
    return response.data.places.map((place: any) => ({
      name: place.displayName,
      address: place.formattedAddress,
      phone: place.nationalPhoneNumber,
      category: place.primaryType,
    }));
  }
  return [];
}


// Main Server Action
export async function scrapeDataAction(prevState: any, formData: FormData) {
  const validatedFields = ScrapeSchema.safeParse({
    country: formData.get("country"),
    country_name: formData.get("country_name"),
    state: formData.get("state"),
    city: formData.get("city"),
    businessType: formData.get("businessType"),
    provider: formData.get("provider"),
    apiKey: formData.get("apiKey"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation failed.",
      data: null,
      input: null,
    };
  }

  const { businessType, provider, apiKey, country_name, state, city } = validatedFields.data;
  
  if (!apiKey) {
      return {
        errors: {},
        message: `API Key for ${provider} is missing. Please add it in the API Key Management section.`,
        data: null,
        input: null,
      };
  }
  
  const location = [city, state, country_name].filter(Boolean).join(', ');

  try {
    let result;
    if (provider === 'serpapi') {
      result = await scrapeWithSerpApi(apiKey, businessType, location);
    } else {
      result = await scrapeWithGoogleMaps(apiKey, businessType, location);
    }
    
    if (result.length === 0) {
        return {
            errors: {},
            message: "No results found for your query. Please try a different location or business type.",
            data: [],
            input: { city, businessType }
        }
    }
    
    revalidatePath('/scraper');

    return {
      errors: {},
      message: `Scraping completed. Found ${result.length} results.`,
      data: result,
      input: { city, businessType }
    };

  } catch (error: any) {
    console.error("Scraping error:", error);
    const errorMessage = error.response?.data?.error_message || error.response?.data?.error?.message || error.message || "An unknown error occurred.";
    return {
      errors: {},
      message: `Scraping failed: ${errorMessage}`,
      data: null,
      input: null,
    };
  }
}

const csc_api_key = process.env.COUNTRY_STATE_CITY_API_KEY;

// Actions for location dropdowns
export async function getCountries() {
    if (!csc_api_key) {
        console.error("COUNTRY_STATE_CITY_API_KEY is not set.");
        return [];
    }
    try {
        const response = await axios.get('https://api.countrystatecity.in/v1/countries', {
            headers: { 'X-CSCAPI-KEY': csc_api_key }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching countries:", error);
        return [];
    }
}

export async function getStatesOfCountry(countryIso2: string) {
    if (!csc_api_key) {
        console.error("COUNTRY_STATE_CITY_API_KEY is not set.");
        return [];
    }
    try {
        const response = await axios.get(`https://api.countrystatecity.in/v1/countries/${countryIso2}/states`, {
            headers: { 'X-CSCAPI-KEY': csc_api_key }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching states for ${countryIso2}:`, error);
        return [];
    }
}

export async function getCitiesOfState(countryIso2: string, stateIso2: string) {
    if (!csc_api_key) {
        console.error("COUNTRY_STATE_CITY_API_KEY is not set.");
        return [];
    }
    try {
        const response = await axios.get(`https://api.countrystatecity.in/v1/countries/${countryIso2}/states/${stateIso2}/cities`, {
            headers: { 'X-CSCAPI-KEY': csc_api_key }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching cities for ${countryIso2} / ${stateIso2}:`, error);
        return [];
    }
}
