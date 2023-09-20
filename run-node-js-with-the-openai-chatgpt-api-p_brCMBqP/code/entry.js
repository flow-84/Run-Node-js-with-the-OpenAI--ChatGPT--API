import { axios } from "@pipedream/platform"
export default defineComponent({
  props: {
    openai: {
      type: "app",
      app: "openai",
    }
  },
  async run({steps, $}) {
    return await axios($, {
      url: `https://api.openai.com/v1/models`,
      headers: {
        Authorization: `Bearer ${this.openai.$auth.api_key}`,
      },
    })
  },
})
