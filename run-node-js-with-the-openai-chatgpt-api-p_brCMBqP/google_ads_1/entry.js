import { axios } from "@pipedream/platform";

export default defineComponent({
  props: {
    google_ads: {
      type: "app",
      app: "google_ads",
    },
  },
  async run({ steps, $ }) {
    try {
      const customerId = "YOUR_CUSTOMER_ID"; // Ersetzen Sie durch die tatsächliche Kunden-ID
      if (!customerId) {
        throw new Error("Customer ID is missing");
      }

      const url = `https://googleads.googleapis.com/v1/customers/${customerId}/adGroupAds:mutate`;
      const config = {
        headers: {
          Authorization: `Bearer ${this.google_ads.$auth.oauth_access_token}`,
        },
      };

      const response = await axios($, {
        url,
        ...config,
      });

      const ads = response.data.adGroupAds || [];
      const rejectedAds = ads.filter((ad) => ad.status === "REJECTED");

      if (rejectedAds.length > 0) {
        return rejectedAds;
      }
    } catch (error) {
      console.error("An error occurred:", error);
      if (error.response) {
        console.error("Error Data:", error.response.data);
        console.error("Error Status:", error.response.status);
      }
      // Weitere Fehlerbehandlung hier
    }
  },
});
