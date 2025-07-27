import base64

# Path to your Google service account JSON file
file_path = "auramed-455016-201ba9c39ca4.json"

# Read and encode in Base64
with open(file_path, "rb") as f:
    encoded = base64.b64encode(f.read()).decode("utf-8")

# Print the base64 string (you can copy-paste this to .env.local or Vercel)
print("\nGOOGLE_KEY_BASE64=" + encoded)

# Optional: Save to a .env.local file
with open(".env.local", "w") as env_file:
    env_file.write(f"GOOGLE_KEY_BASE64={encoded}\n")
    print("\nSaved to .env.local ✅")
