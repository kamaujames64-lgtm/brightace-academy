"""Optional operator-facing UI for the BrightAce Python API."""
import os
import requests
import streamlit as st

st.set_page_config(page_title="BrightAce Python Tools", page_icon="🎓", layout="centered")
st.title("BrightAce Academy — Python Tools")
st.caption("Separate Python tool interface. The existing BrightAce website remains unchanged.")
api_url = os.getenv("BRIGHTACE_API_URL", "http://127.0.0.1:8000").rstrip("/")
api_key = os.getenv("BRIGHTACE_SERVICE_API_KEY", "")

with st.expander("Service status", expanded=True):
    if st.button("Check Python service", type="primary"):
        try:
            health = requests.get(f"{api_url}/health", timeout=5)
            health.raise_for_status()
            caps = requests.get(f"{api_url}/api/v1/capabilities", timeout=5)
            caps.raise_for_status()
            st.success("Python API is reachable.")
            st.json(health.json())
            st.subheader("Available capabilities")
            st.json(caps.json())
        except requests.RequestException as exc:
            st.error("Could not reach the Python API. Check that it is running and BRIGHTACE_API_URL is correct.")
            st.caption(str(exc))

st.subheader("Integration smoke test")
st.write("This test checks the protected job pipeline using a harmless text-statistics feature.")
text_input = st.text_area("Sample text", placeholder="Enter a short sample to count words and lines.")
if st.button("Run text statistics"):
    if not api_key:
        st.error("Set BRIGHTACE_SERVICE_API_KEY in the Streamlit server environment. Never place it in frontend JavaScript.")
    elif not text_input.strip():
        st.warning("Enter some text first.")
    else:
        try:
            response = requests.post(
                f"{api_url}/api/v1/jobs",
                json={"feature": "text_stats", "input": {"text": text_input}},
                headers={"X-BrightAce-Service-Key": api_key},
                timeout=15,
            )
            if response.ok:
                st.success("Feature executed successfully.")
                st.json(response.json()["result"])
            else:
                st.error(f"Service returned HTTP {response.status_code}.")
                st.caption(response.text[:500])
        except requests.RequestException as exc:
            st.error("The API request failed.")
            st.caption(str(exc))

st.info(
    "The Colab notebook has not yet been supplied. Text statistics is only a safe smoke-test feature; "
    "AI, document, image, and video workflows must be added after the notebook or requirements are reviewed."
)
st.markdown("**Local run:** start FastAPI, then run `streamlit run streamlit_app/app.py` from `python-service`.")
