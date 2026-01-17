import json
import os
import re
import shutil  # Library for copying files

# --- CONFIGURATION ---
TEMPLATE_FILE = 'index.html'
DATA_FILE = 'data.json'
STYLE_FILE = 'style.css'
SCRIPT_FILE = 'service.js'
OUTPUT_DIR = 'pages'

def create_slug(text):
    """Converts 'Whirlpool F21 Fix' to 'whirlpool-f21-fix'"""
    slug = text.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    return slug.strip('-')

def copy_assets():
    """Copies css, js, and json to the pages folder so they work standalone."""
    print(f"📂 Copying assets to /{OUTPUT_DIR}...")
    try:
        shutil.copy(STYLE_FILE, os.path.join(OUTPUT_DIR, STYLE_FILE))
        shutil.copy(SCRIPT_FILE, os.path.join(OUTPUT_DIR, SCRIPT_FILE))
        shutil.copy(DATA_FILE, os.path.join(OUTPUT_DIR, DATA_FILE))
        print("✅ Assets copied successfully.")
    except FileNotFoundError as e:
        print(f"❌ Warning: Could not copy an asset file. {e}")

def generate_pages():
    # 1. Load Data
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"❌ Error: Could not find {DATA_FILE}")
        return

    # 2. Load Template
    try:
        with open(TEMPLATE_FILE, 'r', encoding='utf-8') as f:
            template = f.read()
    except FileNotFoundError:
        print(f"❌ Error: Could not find {TEMPLATE_FILE}")
        return

    # 3. Create Output Directory
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    # 4. Copy Assets First
    copy_assets()

    print(f"🚀 Starting generation for {len(data)} error codes...")
    generated_count = 0

    # 5. Loop through every error code
    for item in data:
        brand = item['brand']
        code = item['code']
        issue = item['issue']
        type_ = item['type']
        
        # --- SEO STRATEGY ---
        # Title: "Whirlpool F21 Error Fix | Long Drain Repair"
        page_title = f"{brand} {code} Error Fix | {issue} Repair Guide"
        
        # Desc: "How to fix Whirlpool Washer error F21. Diagnosis: Long Drain Error. Parts list and video guide included."
        page_desc = f"How to fix {brand} {type_} error {code}. Diagnosis: {issue}. Step-by-step DIY repair guide, parts list, and video help."
        
        # Filename: whirlpool-f21-error-fix.html
        slug_base = f"{brand}-{code}-error-fix"
        filename = create_slug(slug_base) + ".html"
        
        # --- TEMPLATE INJECTION ---
        page_content = template
        
        # 1. Replace Title
        # We use regex to safely find the title tag even if it has attributes
        page_content = re.sub(
            r'<title>.*?</title>', 
            f'<title>{page_title}</title>', 
            page_content
        )
        
        # 2. Replace Meta Description
        # Looks for content="..." inside the description meta tag
        page_content = re.sub(
            r'<meta name="description" content=".*?">', 
            f'<meta name="description" content="{page_desc}">', 
            page_content
        )

        # 3. Inject The "Auto-Select" Script
        # This script runs AFTER service.js. It waits for the DB to load, then triggers the specific error.
        auto_select_js = f"""
        <script>
        // PROGRAMMATIC SEO INJECTION
        // This waits for service.js to load the database, then auto-selects this page's error code.
        window.addEventListener('load', () => {{
            const checkDB = setInterval(() => {{
                // Check if the DB global variable from service.js is populated
                if (typeof DB !== 'undefined' && DB.length > 0) {{
                    clearInterval(checkDB);
                    
                    const brandSel = document.getElementById('brandSelect');
                    const typeSel = document.getElementById('typeSelect');
                    const codeSel = document.getElementById('codeSelect');
                    
                    // 1. Set Brand
                    brandSel.value = "{brand}";
                    
                    // 2. Trigger Type Update (passing the type we want)
                    // The 'updateTypes' function in service.js was built to handle this!
                    if (typeof updateTypes === 'function') {{
                        updateTypes("{type_}");
                        
                        // 3. Trigger Code Update (passing the code we want)
                        // 'updateTypes' will call 'updateCodes', but we ensure the code is set
                        setTimeout(() => {{
                            if (typeof updateCodes === 'function') {{
                                updateCodes("{code}");
                            }}
                        }}, 50);
                    }}
                }}
            }}, 100); // Check every 100ms
        }});
        </script>
        """
        
        # Insert script before closing body
        page_content = page_content.replace('</body>', f'{auto_select_js}\n</body>')

        # 6. Write File
        output_path = os.path.join(OUTPUT_DIR, filename)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(page_content)
            
        generated_count += 1

    print(f"✅ Successfully generated {generated_count} pages in '/{OUTPUT_DIR}'.")
    print("👉 You can now test by opening the /pages/ folder.")

if __name__ == "__main__":
    generate_pages()
