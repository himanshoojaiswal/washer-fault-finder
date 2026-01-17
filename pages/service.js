/**
 * WasherCodes - Core Service Logic
 * Handles data fetching, search, and dynamic UI updates.
 */

// Global State
let DB = []; 

// DOM Elements Cache
const els = {
    search: document.getElementById('searchInput'),
    brand: document.getElementById('brandSelect'),
    type: document.getElementById('typeSelect'),
    code: document.getElementById('codeSelect'),
    card: document.getElementById('solutionCard'),
    
    // Result Fields
    resCode: document.getElementById('resCode'),
    resIssue: document.getElementById('resIssue'),
    resFix: document.getElementById('resFix'),
    resParts: document.getElementById('resParts'),
    btnBuy: document.getElementById('btnBuy'),
    btnVideo: document.getElementById('btnVideo')
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    setupEventListeners();
});

function fetchData() {
    fetch('data.json')
        .then(response => {
            if (!response.ok) throw new Error("Failed to load database");
            return response.json();
        })
        .then(data => {
            DB = data;
            populateBrands();
            console.log(`✅ Loaded ${DB.length} error codes.`);
        })
        .catch(err => {
            console.error("Critical Error:", err);
            els.card.innerHTML = `<p style="color:red; text-align:center;">Error loading database. Please refresh the page.</p>`;
            els.card.style.display = 'block';
        });
}

function setupEventListeners() {
    // Dropdown Chain
    els.brand.addEventListener('change', () => updateTypes());
    els.type.addEventListener('change', () => updateCodes());
    els.code.addEventListener('change', () => renderSolution());

    // Smart Search (Debounced)
    let timeout = null;
    els.search.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => handleSearch(e.target.value), 300);
    });
}

// --- LOGIC: CASCADING DROPDOWNS ---

function populateBrands() {
    // Get unique brands and sort A-Z
    const brands = [...new Set(DB.map(item => item.brand))].sort();
    
    brands.forEach(brand => {
        const option = new Option(brand, brand);
        els.brand.add(option);
    });
}

/**
 * Updates the 'Type' dropdown based on selected Brand.
 * @param {string|null} preSelectedType - Optional: Force select this type (used by SEO pages)
 */
function updateTypes(preSelectedType = null) {
    // Reset downstream
    els.type.innerHTML = '<option value="">Select Type</option>';
    els.code.innerHTML = '<option value="">--</option>';
    els.type.disabled = true;
    els.code.disabled = true;
    hideSolution();

    const selectedBrand = els.brand.value;
    if (!selectedBrand) return;

    // Filter DB for this brand
    const availableTypes = [...new Set(DB
        .filter(item => item.brand === selectedBrand)
        .map(item => item.type)
    )];

    availableTypes.forEach(type => {
        els.type.add(new Option(type, type));
    });
    els.type.disabled = false;

    // Logic for Programmatic SEO Auto-Select
    if (preSelectedType && availableTypes.includes(preSelectedType)) {
        els.type.value = preSelectedType;
        // Trigger next step immediately
        updateCodes(); 
    }
}

/**
 * Updates the 'Code' dropdown based on Brand + Type.
 * @param {string|null} preSelectedCode - Optional: Force select this code
 */
function updateCodes(preSelectedCode = null) {
    els.code.innerHTML = '<option value="">Select Code</option>';
    els.code.disabled = true;
    hideSolution();

    const selectedBrand = els.brand.value;
    const selectedType = els.type.value;

    if (!selectedBrand || !selectedType) return;

    // Get codes
    const codes = DB.filter(item => 
        item.brand === selectedBrand && item.type === selectedType
    );

    codes.forEach(item => {
        // Display format: "F21 - Long Drain Error"
        const label = `${item.code} - ${item.issue}`;
        els.code.add(new Option(label, item.code));
    });
    els.code.disabled = false;

    if (preSelectedCode) {
        els.code.value = preSelectedCode;
        renderSolution();
    }
}

// --- LOGIC: RENDER RESULT ---

function renderSolution() {
    const brand = els.brand.value;
    const type = els.type.value;
    const code = els.code.value;

    const entry = DB.find(item => 
        item.brand === brand && 
        item.type === type && 
        item.code === code
    );

    if (!entry) {
        hideSolution();
        return;
    }

    // 1. Populate Text
    els.resCode.textContent = entry.code;
    els.resIssue.textContent = entry.issue;
    els.resFix.textContent = entry.fix_summary;

    // 2. Populate Parts (as tags)
    els.resParts.innerHTML = ''; // Clear previous
    if (entry.parts_needed && entry.parts_needed.length > 0) {
        entry.parts_needed.forEach(part => {
            const span = document.createElement('span');
            span.className = 'parts-tag';
            span.textContent = part;
            els.resParts.appendChild(span);
        });
    } else {
        els.resParts.innerHTML = '<span style="color:#64748b; font-size:0.9rem;">No specific parts listed. Check manual.</span>';
    }

    // 3. Update Buttons
    els.btnBuy.href = entry.affiliate_link;
    els.btnVideo.href = entry.video_guide;

    // 4. Show Card with Animation
    els.card.classList.remove('hidden');
    els.card.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideSolution() {
    els.card.classList.add('hidden');
}

// --- LOGIC: SMART SEARCH ---

function handleSearch(query) {
    const q = query.toLowerCase().trim();
    if (q.length < 2) return; // Don't search for single letters

    // Search Strategy: Match Code OR Issue OR Fix text
    const match = DB.find(item => {
        const fullString = `${item.brand} ${item.code} ${item.issue} ${item.fix_summary}`.toLowerCase();
        return fullString.includes(q);
    });

    if (match) {
        // Auto-fill the dropdowns to match the result
        els.brand.value = match.brand;
        
        // We manually trigger the updates to ensure the chain works
        updateTypes(match.type);
        
        // We need a tiny delay for the second step to ensure options are populated
        // Note: In this synchronous implementation, updateTypes populates immediately,
        // so we can call updateCodes right after.
        
        // However, to be safe and ensure the DOM is ready:
        setTimeout(() => {
            els.code.value = match.code;
            renderSolution();
        }, 50);
    }
}

// --- EXPORT FOR SEO GENERATOR ---
// This allows the generated HTML pages to call this function on load
window.showSolution = renderSolution;
