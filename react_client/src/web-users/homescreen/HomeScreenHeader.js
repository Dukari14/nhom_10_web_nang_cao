import React from 'react';
import './css/HomeScreenHeader.css';

function Logo(){
  return(
    <div className="Logo">
      <h2>
        <a href="/trangchu">Duka Mobile Shop</a>
      </h2>
    </div>
  );
}

function DanhMuc(){
  return(
    <div className="DanhMuc">
      <nav>
        <ul>
          <li><a href="/gioi-thieu">Giới thiệu</a></li>
          <li><a href="/san-pham">Sản phẩm</a></li>
          <li><a href="/tin-tuc">Tin tức</a></li>
          <li><a href="/lien-he">Liên hệ</a></li>
        </ul>
      </nav>
    </div>
  );
}

function DanhMucSanPham(){
  return(
    <div className="DanhMucSanPham">
      <nav>
        <ul>
          <li><a href="/sanpham/dien-thoai">Điện thoại</a></li>
          <li><a href="/sanpham/laptop">Laptop</a></li>
          <li><a href="/sanpham/may-tinh-bang">Máy tính bảng</a></li>
          <li><a href="/sanpham/phu-kien">Phụ kiện</a></li>
          <li><a href="/sanpham/tai-nghe">Tai nghe</a></li>
        </ul>
      </nav>
    </div>
  );
}

export default function HomeScreenHeader() {
    return (
      <header className="App-header">
        <div className="App-header-content">
          <Logo />
          <DanhMuc />
        </div>
        <div className="App-header-content2">
          <DanhMucSanPham />
        </div>
      </header>
    );
}