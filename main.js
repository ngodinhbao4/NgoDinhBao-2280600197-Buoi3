const API_URL = 'https://api.escuelajs.co/api/v1/products';
const DEFAULT_IMG = 'https://i.imgur.com/1k9dY5L.png';

// --- STATE ---
let allProducts = [];
let currentFilteredList = [];
let currentPage = 1;
let rowsPerPage = 10;
let currentSortCriteria = 'default'; // Biến lưu trạng thái sắp xếp

// --- TIỆN ÍCH ---
function cleanImageUrl(url) {
    if (!url) return DEFAULT_IMG;
    if (typeof url === 'string') {
        const match = url.match(/https?:\/\/[^"\]]+/);
        if (match) {
            const cleanUrl = match[0];
            if (cleanUrl.includes('placeimg.com') || cleanUrl.includes('via.placeholder.com')) {
                return DEFAULT_IMG;
            }
            return cleanUrl;
        }
    }
    return DEFAULT_IMG;
}

// --- LOGIC SẮP XẾP ---
// Hàm này nhận vào 1 danh sách và trả về danh sách đã sắp xếp (tạo mảng mới)
function sortList(list) {
    const sortedList = [...list]; // Copy mảng để không ảnh hưởng dữ liệu gốc

    switch (currentSortCriteria) {
        case 'price-asc': // Giá tăng dần
            return sortedList.sort((a, b) => a.price - b.price);
        case 'price-desc': // Giá giảm dần
            return sortedList.sort((a, b) => b.price - a.price);
        case 'name-asc': // Tên A-Z
            return sortedList.sort((a, b) => a.title.localeCompare(b.title));
        case 'name-desc': // Tên Z-A
            return sortedList.sort((a, b) => b.title.localeCompare(a.title));
        default: // Mặc định (theo ID hoặc thứ tự gốc)
            return sortedList.sort((a, b) => a.id - b.id);
    }
}

// --- LOGIC HIỂN THỊ ---
function displayData() {
    const tableBody = document.getElementById('table-body');
    const pageInfo = document.getElementById('page-info');
    const btnPrev = document.getElementById('prev-btn');
    const btnNext = document.getElementById('next-btn');

    // 1. Sắp xếp danh sách hiện tại (đã lọc)
    const sortedList = sortList(currentFilteredList);

    // 2. Tính toán Phân trang
    const totalItems = sortedList.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;

    if (currentPage > totalPages) currentPage = 1;

    // 3. Cắt dữ liệu (Slice)
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const productsOnPage = sortedList.slice(startIndex, endIndex);

    // 4. Render
    if (totalItems === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center">Không tìm thấy kết quả</td></tr>';
        pageInfo.innerText = 'Trang 0 / 0';
        btnPrev.disabled = true;
        btnNext.disabled = true;
        return;
    }

    const htmlContent = productsOnPage.map(product => {
        const rawUrl = product.images.length > 0 ? product.images[0] : null;
        const finalImageUrl = cleanImageUrl(rawUrl);

        return `
            <tr>
                <td>#${product.id}</td>
                <td>
                    <img src="${finalImageUrl}" class="product-img" alt="${product.title}" 
                         referrerpolicy="no-referrer"
                         onerror="this.onerror=null;this.src='${DEFAULT_IMG}'">
                </td>
                <td>${product.title}</td>
                <td class="price-tag">$${product.price}</td>
                <td>${product.category ? product.category.name : 'N/A'}</td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = htmlContent;

    // Cập nhật UI
    pageInfo.innerText = `Trang ${currentPage} / ${totalPages}`;
    btnPrev.disabled = currentPage === 1;
    btnNext.disabled = currentPage === totalPages;
}

// --- KHỞI TẠO & SỰ KIỆN ---
async function getAllProducts() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        allProducts = data;
        currentFilteredList = data; 
        displayData();
    } catch (error) {
        console.error(error);
    }
}

// Sự kiện Tìm kiếm
document.getElementById('search-input').addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    currentFilteredList = allProducts.filter(p => p.title.toLowerCase().includes(keyword));
    currentPage = 1;
    displayData();
});

// Sự kiện Sắp xếp (MỚI)
document.getElementById('sort-select').addEventListener('change', (e) => {
    currentSortCriteria = e.target.value; // Cập nhật tiêu chí sắp xếp
    currentPage = 1; // Reset về trang 1 khi đổi cách sắp xếp để người dùng thấy kết quả ngay
    displayData();
});

// Sự kiện Đổi số dòng
document.getElementById('rows-per-page').addEventListener('change', (e) => {
    rowsPerPage = parseInt(e.target.value);
    currentPage = 1;
    displayData();
});

// Nút phân trang
document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        displayData();
    }
});

document.getElementById('next-btn').addEventListener('click', () => {
    const totalPages = Math.ceil(currentFilteredList.length / rowsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayData();
    }
});

getAllProducts();