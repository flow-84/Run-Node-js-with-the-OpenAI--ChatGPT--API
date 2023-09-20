import { axios } from "@pipedream/platform";
import translate from '@vitalets/google-translate-api';

export default defineComponent({
  props: {
    google_ads: {
      type: "app",
      app: "google_ads",
    },
  },
  methods: {
    async reformulateAd(ad) {
      try {
        const { headline, description, keywords } = ad;
        const translatedHeadline = await translate(headline, { to: 'de' });
        const translatedDescription = await translate(description, { to: 'de' });
        return {
          ...ad,
          headline: translatedHeadline.text.slice(0, headline.length),
          description: translatedDescription.text.slice(0, description.length),
        };
      } catch (error) {
        console.error("Error in reformulateAd:", error);
        return ad; // Return the original ad if an error occurs
      }
    },
  },
  async run({ steps, $ }) {
    try {
      const adsResponse = await axios($, {
        url: `https://googleads.googleapis.com/v1/customers/${this.google_ads.$auth.customer_id}/googleAds:search`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.google_ads.$auth.oauth_access_token}`,
          "developer-token": this.google_ads.$auth.developer_token,
        },
        data: {
          query: "SELECT ad_group.id, ad_group_criterion.criterion_id, ad.headline, ad.description, ad.keywords FROM ad_group_ad WHERE ad.type = 'EXPANDED_TEXT_AD'",
        },
      });

      const updatedAds = await Promise.all(adsResponse.ads.map(this.reformulateAd));

      const updateResponses = [];
      for (const batch of chunkArray(updatedAds, 10)) { // Batch of 10 ads
        const batchResponse = await Promise.all(batch.map((ad) => {
          return axios($, {
            url: `https://googleads.googleapis.com/v1/customers/${this.google_ads.$auth.customer_id}/googleAds:mutate`,
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.google_ads.$auth.oauth_access_token}`,
              "developer-token": this.google_ads.$auth.developer_token,
            },
            data: {
              operations: [{
                update: ad,
                updateMask: {
                  paths: ['headline', 'description'],
                },
              }],
            },
          });
        }));
        updateResponses.push(...batchResponse);
      }

      return updateResponses;
    } catch (error) {
      console.error("An error occurred:", error);
      if (error.response) {
        console.error("Error Data:", error.response.data);
        console.error("Error Status:", error.response.status);
      }
      // Further error handling here
    }
  },
});

// Utility function to chunk an array into smaller arrays
function chunkArray(array, size) {
  const chunked = [];
  for (let i = 0; i < array.length; i += size) {
    chunked.push(array.slice(i, i + size));
  }
  return chunked;
}
