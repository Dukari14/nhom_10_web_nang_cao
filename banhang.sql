CREATE TABLE users (
    user_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()), -- Khóa chính dạng UUID
    email VARCHAR(100) NOT NULL UNIQUE,     -- Email dùng để đăng nhập, phải là duy nhất
    password_hash VARCHAR(255) NOT NULL,    -- Lưu mật khẩu ĐÃ HÃM (Bcrypt/Argon2), TUYỆT ĐỐI KHÔNG LƯU PLAIN TEXT
    role ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
    is_active BOOLEAN NOT NULL DEFAULT TRUE, -- FALSE = tài khoản bị admin khóa
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Bảng lưu thông tin chi tiết người dùng (Profile)
CREATE TABLE user_profiles (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,                  -- Khóa ngoại liên kết với bảng users
    full_name VARCHAR(100) NOT NULL,       -- Họ và tên
    phone VARCHAR(20) DEFAULT NULL,        -- Số điện thoại
    avatar_url VARCHAR(255) DEFAULT NULL,  -- Đường dẫn ảnh đại diện
    gender ENUM('male', 'female', 'other') DEFAULT NULL,
    date_of_birth DATE DEFAULT NULL,       -- Ngày sinh
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Thiết lập khóa ngoại để liên kết 2 bảng và tự động xóa profile nếu user bị xóa
    CONSTRAINT fk_user_profile 
        FOREIGN KEY (user_id) 
        REFERENCES users(user_id) 
        ON DELETE CASCADE
);

-- 3. Bảng danh mục sản phẩm
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,            -- Tên danh mục (vd: Điện thoại Xiaomi)
    slug VARCHAR(100) NOT NULL UNIQUE,     -- Đường dẫn thân thiện (vd: dien-thoai-xiaomi)
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Cập nhật bảng products để thêm khóa ngoại liên kết với danh mục
CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,              -- Khóa ngoại trỏ đến danh mục
    name VARCHAR(255) NOT NULL,            -- Tên sản phẩm (vd: Xiaomi 14 Pro)
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT DEFAULT NULL,
    brand VARCHAR(100) DEFAULT NULL,       -- Thương hiệu (vd: Samsung, Apple)
    ram VARCHAR(20) DEFAULT NULL,          -- RAM (vd: 8GB)
    storage VARCHAR(20) DEFAULT NULL,      -- Dung lượng bộ nhớ trong (vd: 256GB)
    color VARCHAR(50) DEFAULT NULL,        -- Màu sắc
    config_description TEXT DEFAULT NULL,  -- Mô tả cấu hình chi tiết (màn hình, chip, camera, pin...)
    price DECIMAL(10, 2) NOT NULL,
    sale_price DECIMAL(10, 2) DEFAULT NULL,
    stock INT NOT NULL DEFAULT 0,
    image_url VARCHAR(255) DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Thiết lập khóa ngoại
    CONSTRAINT fk_product_category 
        FOREIGN KEY (category_id) 
        REFERENCES categories(category_id) 
        ON DELETE RESTRICT -- Không cho phép xóa danh mục nếu vẫn còn sản phẩm thuộc danh mục đó
);

CREATE TABLE carts(
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,          -- Khóa ngoại liên kết với bảng users
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_cart_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(user_id) 
        ON DELETE CASCADE
);

CREATE TABLE cart_items (
    cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,                  -- Khóa ngoại liên kết với bảng carts
    product_id INT NOT NULL,               -- Khóa ngoại liên kết với bảng products
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_cart_item_cart 
        FOREIGN KEY (cart_id) 
        REFERENCES carts(cart_id) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_cart_item_product 
        FOREIGN KEY (product_id) 
        REFERENCES products(product_id) 
        ON DELETE RESTRICT -- Không cho phép xóa sản phẩm nếu vẫn còn trong giỏ hàng
);

CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,          -- Khóa ngoại liên kết với bảng users
    total_amount DECIMAL(14, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'shipping', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
    shipping_address VARCHAR(255) NOT NULL, -- Địa chỉ giao hàng
    phone VARCHAR(20) NOT NULL,             -- Số điện thoại người nhận
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_order_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(user_id) 
        ON DELETE CASCADE
);

CREATE TABLE order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,                 -- Khóa ngoại liên kết với bảng orders
    product_id INT NOT NULL,               -- Khóa ngoại liên kết với bảng products
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(14, 2) NOT NULL,         -- Giá tại thời điểm đặt hàng
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_order_item_order 
        FOREIGN KEY (order_id) 
        REFERENCES orders(order_id) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_order_item_product 
        FOREIGN KEY (product_id) 
        REFERENCES products(product_id) 
        ON DELETE RESTRICT -- Không cho phép xóa sản phẩm nếu vẫn còn trong đơn hàng
);

CREATE TABLE reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,               -- Khóa ngoại liên kết với bảng products
    user_id VARCHAR(36) NOT NULL,          -- Khóa ngoại liên kết với bảng users
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_review_product 
        FOREIGN KEY (product_id) 
        REFERENCES products(product_id) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_review_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(user_id) 
        ON DELETE CASCADE
);

CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,                 -- Khóa ngoại liên kết với bảng orders
    amount DECIMAL(14, 2) NOT NULL,
    payment_method ENUM('COD', 'BANK_TRANSFER') NOT NULL DEFAULT 'COD', -- COD: thanh toán khi nhận hàng
    status ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_payment_order 
        FOREIGN KEY (order_id) 
        REFERENCES orders(order_id) 
        ON DELETE CASCADE
);