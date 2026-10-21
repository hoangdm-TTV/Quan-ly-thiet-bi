-- One-time seed generated from the legacy data snapshot.
-- Apply only after server/schema.sql and only to an empty database.
-- 18 unresolved user references are set to NULL to satisfy foreign keys.

BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM departments UNION ALL SELECT 1 FROM users UNION ALL SELECT 1 FROM devices UNION ALL SELECT 1 FROM handovers UNION ALL SELECT 1 FROM maintenance UNION ALL SELECT 1 FROM audits UNION ALL SELECT 1 FROM audit_records UNION ALL SELECT 1 FROM app_metadata) THEN
    RAISE EXCEPTION 'Refusing to apply legacy seed: target database is not empty';
  END IF;
END $$;

INSERT INTO departments (id, name, code, manager, room)
VALUES
  ('dept-1', 'Ban Giám Đốc', 'BGD', 'Trần Đình Quang', 'P.701 - Tầng 7'),
  ('dept-2', 'Phòng Công Nghệ Thông Tin (IT)', 'IT', 'Nguyễn Văn Hùng', 'P.402 - Tầng 4'),
  ('dept-3', 'Phòng Phát Triển Sản Phẩm (R&D)', 'RND', 'Lê Hoàng Nam', 'P.405 - Tầng 4'),
  ('dept-4', 'Phòng Kinh Doanh & Bán Hàng', 'SALES', 'Phạm Thị Mai', 'P.301 - Tầng 3'),
  ('dept-5', 'Phòng Marketing & Truyền Thông', 'MKT', 'Vũ Đức Thịnh', 'P.302 - Tầng 3'),
  ('dept-6', 'Phòng Kế Toán - Tài Chính', 'ACC', 'Hoàng Bích Ngân', 'P.501 - Tầng 5'),
  ('dept-7', 'Phòng Nhân Sự & Hành Chính', 'HR', 'Đỗ Thúy Hằng', 'P.502 - Tầng 5');

INSERT INTO users (id, code, name, email, phone, department_id, position, avatar)
VALUES
  ('user-1792225138218', 'NV001', 'Đỗ Minh Hoàng', 'hoangdm@trithucvietbn.com', '0245245845', 'dept-2', 'Nhân viên', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'),
  ('user-1791616375982', 'GD002', 'Nguyễn Quang Nghiêm', 'nghiemnq@trithucvietbn.com', '', 'dept-1', 'Giám đốc điều hành', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'),
  ('user-1791616141870', 'GD001', 'Nguyễn Quang Ninh', 'ninhnq@trithucvietbn.com', '', 'dept-1', 'Giám đốc ', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');

INSERT INTO devices (id, code, name, category, brand, model, serial, specs, status, user_id, department_id, purchase_date, purchase_cost, warranty_until, location, notes)
VALUES
  ('dev-1791615545426', 'TS-014', 'Laptop Dell Inspiron 5593 - I7-1065G7/8GB/512GB PCIE/VGA 2GB/15.6 FHD/WIN10/BẠC', 'laptop', 'Dell ', 'Inspiron 5593', '', 'Intel Core i7 -1065G7, RAM 8GB DDR4, SSD 512GB, 15,6 inch FHD IPS', 'available', NULL, NULL, '2026-10-10', 24000000, NULL, 'Kho IT Tầng 4', ''),
  ('dev-1', 'TS-001', 'MacBook Pro 16" M3 Max 36GB/1TB', 'laptop', 'Apple', 'MacBook Pro 16 2023', 'C02G3498MD6T', 'Apple M3 Max (14 CPU/30 GPU), RAM 36GB Unified, SSD 1TB, Liquid Retina XDR 16.2 inch', 'available', NULL, 'dept-1', '2024-01-15', 79900000, '2026-01-15', 'Kho IT', 'Máy kèm sạc 140W zin và túi chống sốc Tomtoc.'),
  ('dev-2', 'TS-002', 'ThinkPad X1 Carbon Gen 11 i7-1365U 32GB', 'laptop', 'Lenovo', 'X1 Carbon Gen 11', 'PF47X89Q', 'Intel Core i7-1365U vPro, RAM 32GB LPDDR5, SSD 1TB NVMe, 14 inch 2.8K OLED', 'in_use', NULL, 'dept-2', '2023-11-20', 45500000, '2026-11-20', 'P.402 - Phòng IT', 'Kèm dock sạc Lenovo USB-C Pro.'),
  ('dev-3', 'TS-003', 'Dell Precision 3660 Tower i7-13700 RTX A4000', 'pc', 'Dell', 'Precision 3660 Workstation', '8KH2QW3', 'Intel Core i7-13700 16-Core, RAM 64GB DDR5, SSD 1TB Gen4 + 2TB HDD, NVIDIA RTX A4000 16GB', 'in_use', NULL, 'dept-3', '2023-08-10', 56000000, '2026-08-10', 'P.405 - Bàn Lead Dev', 'Máy trạm dựng đồ họa & build phần mềm.'),
  ('dev-4', 'TS-004', 'Màn hình Dell UltraSharp 27" 4K U2723QE', 'monitor', 'Dell', 'U2723QE IPS Black', 'CN-0N86K1-WS200-34K-092M', '27 inch 4K IPS Black 2000:1, USB-C Hub 90W PD, RJ45 Ethernet, 100% sRGB & DCI-P3 98%', 'in_use', NULL, 'dept-3', '2023-09-05', 13500000, '2026-09-05', 'P.405 - Bàn Designer', 'Màu chuẩn cho thiết kế đồ họa.'),
  ('dev-5', 'TS-005', 'Dell Latitude 5440 i5-1335U 16GB 512GB', 'laptop', 'Dell', 'Latitude 5440', '4V8B2P3', 'Intel Core i5-1335U, RAM 16GB DDR5, SSD 512GB NVMe, 14.0 inch FHD Anti-Glare', 'in_use', NULL, 'dept-4', '2024-02-18', 21900000, '2027-02-18', 'P.301 - Phòng Sales', 'Cấp cho Trưởng phòng Kinh Doanh.'),
  ('dev-6', 'TS-006', 'Dell Latitude 5440 i5-1335U 16GB 512GB', 'laptop', 'Dell', 'Latitude 5440', '9Q1K7L2', 'Intel Core i5-1335U, RAM 16GB DDR5, SSD 512GB NVMe, 14.0 inch FHD Anti-Glare', 'available', NULL, 'dept-2', '2024-02-18', 21900000, '2027-02-18', 'Kho IT Tầng 4 - Kệ A2', 'Máy lưu kho IT sẵn sàng cấp cho nhân sự mới.'),
  ('dev-7', 'TS-007', 'Máy chủ Dell PowerEdge R650 1U 2x Xeon Silver 4314', 'server', 'Dell', 'PowerEdge R650', '7M4P9X1', 'Dual Intel Xeon Silver 4314 (32 Cores/64 Threads), RAM 128GB RDIMM, 4x 1.92TB NVMe SAS SSD RAID 10, iDRAC9 Ent', 'in_use', NULL, 'dept-2', '2023-05-12', 165000000, '2028-05-12', 'Data Center Tầng 4 - Rack 02 U10-U11', 'Chạy cụm máy chủ ảo hóa nội bộ Proxmox VE.'),
  ('dev-8', 'TS-008', 'Switch Cisco Catalyst 1000 48 Ports PoE+ Gigabit', 'network', 'Cisco', 'C1000-48FP-4G-L', 'FOC2534X01V', '48 Port Gigabit Ethernet PoE+ (Tổng công suất 740W), 4x 1G SFP Uplink Ports', 'in_use', NULL, 'dept-2', '2023-04-01', 38000000, '2026-04-01', 'Tủ mạng Tầng 3 - Rack Switch 01', 'Cung cấp mạng và nguồn cho camera + AP tầng 3.'),
  ('dev-9', 'TS-009', 'Máy in đa năng HP LaserJet Enterprise MFP M528dn', 'printer', 'HP', 'LaserJet MFP M528dn', 'VNC3K08912', 'In Laser 2 mặt tự động 45 trang/phút, Scan ADF 2 mặt, Copy, kết nối mạng LAN Gigabit', 'in_use', NULL, 'dept-7', '2023-06-25', 28500000, '2025-06-25', 'Khu vực in ấn Hành Chính - Tầng 5', 'Dùng chung cho Kế Toán và Hành Chính Nhân Sự.'),
  ('dev-10', 'TS-010', 'MacBook Air 15" M2 16GB 512GB Midnight', 'laptop', 'Apple', 'MacBook Air 15 2023', 'C02JK3491LP2', 'Apple M2 (8 CPU/10 GPU), RAM 16GB, SSD 512GB, 15.3 inch Liquid Retina Display', 'borrowed', NULL, 'dept-4', '2023-12-01', 36900000, '2025-12-01', 'Mang đi công tác (Khách hàng TP.HCM)', 'Mượn đi công tác demo sản phẩm với đối tác.'),
  ('dev-11', 'TS-011', 'Màn hình LG 27UP850N-W 27" 4K IPS Type-C', 'monitor', 'LG', '27UP850N-W', '302NTYQ4P890', '27 inch 4K IPS HDR400, DCI-P3 95%, USB Type-C 90W PD, Loa tích hợp Waves MaxxAudio', 'maintenance', NULL, 'dept-2', '2023-03-10', 10200000, '2025-03-10', 'Trung tâm bảo hành LG - 23 Láng Hạ', 'Bị sọc ngang mờ góc dưới, gửi bảo hành thay panel.'),
  ('dev-12', 'TS-012', 'Laptop HP EliteBook 840 G8 i5-1135G7 16GB', 'laptop', 'HP', 'EliteBook 840 G8', '5CG12489MN', 'Intel Core i5-1135G7, RAM 16GB DDR4, SSD 256GB, 14 inch FHD IPS', 'broken', NULL, 'dept-2', '2021-08-15', 22000000, '2023-08-15', 'Kho thiết bị hỏng - Tầng hầm B1', 'Chết mainboard và phồng pin, đã đề xuất thanh lý linh kiện.'),
  ('dev-13', 'TS-013', 'Máy in màu Canon imageCLASS LBP623Cdw', 'printer', 'Canon', 'LBP623Cdw', 'NM478902B', 'In laser màu 21 trang/phút, Duplex tự động, Wifi, Gigabit LAN', 'liquidated', NULL, 'dept-5', '2020-04-10', 8900000, '2021-04-10', 'Đã xuất kho thanh lý', 'Hỏng cụm sấy và hộp quang, chi phí sửa cao nên đã thanh lý phế liệu T1/2024.');

INSERT INTO handovers (id, code, type, device_id, user_id, department_id, handover_date, expected_return_date, actual_return_date, status, giver_id, giver_name, device_condition, notes)
VALUES
  ('ho-1', 'BG-2024-001', 'handover', 'dev-1', NULL, 'dept-1', '2024-01-16', NULL, '2026-10-10', 'returned', NULL, 'Nguyễn Văn Hùng (IT Lead)', 'Máy mới nguyên seal 100%, kèm phụ kiện sạc zin 140W', 'Cấp phát máy làm việc cho Tổng Giám Đốc Trần Đình Quang.'),
  ('ho-2', 'BG-2024-002', 'handover', 'dev-2', NULL, 'dept-2', '2023-11-21', NULL, NULL, 'active', NULL, 'Bùi Tuấn Anh (IT Support)', 'Máy mới 100%, cài sẵn Windows 11 Pro bản quyền và các tools quản trị', 'Bàn giao thiết bị làm việc cho Trưởng Phòng IT.'),
  ('ho-3', 'BG-2024-003', 'handover', 'dev-3', NULL, 'dept-3', '2023-08-11', NULL, NULL, 'active', NULL, 'Nguyễn Văn Hùng (IT Lead)', 'Máy trạm hoàn chỉnh, cấu hình RTX A4000 16GB, đã stress test 24h', 'Cấp máy trạm cho Lead Developer phòng R&D.'),
  ('ho-4', 'PM-2024-001', 'borrow', 'dev-10', NULL, 'dept-4', '2024-10-01', '2024-10-15', NULL, 'active', NULL, 'Bùi Tuấn Anh (IT Support)', 'Tốt 98%, pin 99%, kèm sạc 35W Dual Port và túi xách', 'Mượn đi công tác hội nghị khách hàng miền Nam tại TP.HCM.'),
  ('ho-5', 'PM-2024-002', 'borrow', 'dev-6', NULL, 'dept-5', '2024-09-10', '2024-09-20', '2024-09-19', 'returned', NULL, 'Bùi Tuấn Anh (IT Support)', 'Khi bàn giao: mới 100%. Khi trả: máy nguyên vẹn không trầy xước.', 'Mượn tổ chức workshop sự kiện Marketing Q3.');

INSERT INTO maintenance (id, code, device_id, issue, solution, cost, vendor, status, start_date, completed_date, technician, notes)
VALUES
  ('maint-1', 'BT-2024-001', 'dev-11', 'Màn hình LG 27UP850N-W xuất hiện dải sọc mờ ngang góc dưới màn hình sau khi dùng 8 tháng', 'Liên hệ TTBH LG chính hãng bảo hành thay panel tấm nền IPS mới', 0, 'Trung tâm Bảo hành LG Electronics Việt Nam', 'in_progress', '2024-10-02', NULL, 'Kỹ thuật viên LG Hoàng Việt', 'Dự kiến trả máy vào ngày 12/10/2024.'),
  ('maint-2', 'BT-2024-002', 'dev-7', 'Bảo trì định kỳ cụm quạt tản nhiệt, vệ sinh khe hút gió và cập nhật firmware iDRAC/BIOS', 'Vệ sinh công nghiệp khí nén, tra keo tản nhiệt MX-4, update BIOS lên phiên bản 1.9.2', 1500000, 'Nội bộ IT & Đối tác CMC Telecom', 'completed', '2024-08-20', '2024-08-21', 'Bùi Tuấn Anh', 'Nhiệt độ CPU giảm 8 độ C sau vệ sinh, quạt chạy êm.'),
  ('maint-3', 'BT-2024-003', 'dev-9', 'Máy in HP M528dn kẹt giấy ở khay nạp tự động ADF và có tiếng kêu cọt kẹt', 'Thay cụm cao su cuốn giấy (roller kit) và bôi mỡ nhiệt bánh răng', 850000, 'Công ty CP Thiết bị Văn phòng Á Châu', 'completed', '2024-07-15', '2024-07-16', 'KTV Nam Hải (Á Châu)', 'Đã test in và scan 2 mặt 50 trang thử nghiệm chạy mượt mà.'),
  ('maint-4', 'BT-2024-004', 'dev-3', 'Lên lịch bảo trì định kỳ 6 tháng: Thổi bụi tản nhiệt nước AIO và kiểm tra sức khỏe SSD NVMe', 'Kiểm tra SMART health SSD, vệ sinh lọc bụi case và cánh quạt tản nhiệt', 300000, 'Phòng IT nội bộ', 'scheduled', '2024-11-15', NULL, 'Bùi Tuấn Anh', 'Lịch bảo trì theo kế hoạch quý 4.');

INSERT INTO audits (id, code, title, audit_date, auditor, status, notes, total_checked, matched_count, discrepancy_count)
VALUES
  ('audit-1792228796845', 'KK-2026-Q4', 'Kiểm kê tài sản thiết bị IT Quý 4/2026', '2026-10-17', 'Tổ Kiểm kê Tài sản Công nghệ Thông tin', 'in_progress', 'Kiểm kê định kỳ hiện trạng tài sản, rà soát thất thoát và lập kế hoạch bảo trì.', 0, 11, 0),
  ('audit-1', 'KK-2024-Q3', 'Kiểm kê tài sản thiết bị IT Quý 3/2024', '2024-09-28', 'Nguyễn Văn Hùng & Hoàng Bích Ngân (Kế toán)', 'completed', 'Kiểm kê định kỳ toàn bộ thiết bị văn phòng tầng 3, 4, 5 và phòng Server.', 13, 12, 2),
  ('audit-2', 'KK-2024-Q4', 'Đợt kiểm kê tài sản IT cuối năm 2024', '2024-12-25', 'Tổ Kiểm kê Tài sản Công ty', 'in_progress', 'Đợt kiểm kê phục vụ quyết toán tài sản và lập ngân sách trang thiết bị năm mới.', 13, 9, 0);

INSERT INTO audit_records (audit_id, device_id, status, note)
VALUES
  ('audit-1792228796845', 'dev-1', 'confirmed', 'Đã quét kiểm tra thực tế khớp'),
  ('audit-1792228796845', 'dev-2', 'confirmed', 'Đã quét kiểm tra thực tế khớp'),
  ('audit-1792228796845', 'dev-3', 'confirmed', 'Đã quét kiểm tra thực tế khớp'),
  ('audit-1792228796845', 'dev-4', 'confirmed', 'Đã quét kiểm tra thực tế khớp'),
  ('audit-1792228796845', 'dev-13', 'confirmed', 'Đã hoàn tất thanh lý có biên bản kế toán'),
  ('audit-1792228796845', 'dev-1791615545426', 'confirmed', 'Phát hiện lỗi / Lệch vị trí'),
  ('audit-1792228796845', 'dev-5', 'confirmed', 'Đã quét kiểm tra thực tế khớp'),
  ('audit-1792228796845', 'dev-6', 'confirmed', 'Đã quét kiểm tra thực tế khớp'),
  ('audit-1792228796845', 'dev-7', 'confirmed', 'Đã quét kiểm tra thực tế khớp'),
  ('audit-1792228796845', 'dev-8', 'confirmed', 'Đã quét kiểm tra thực tế khớp'),
  ('audit-1792228796845', 'dev-9', 'confirmed', 'Đã quét kiểm tra thực tế khớp'),
  ('audit-1', 'dev-1', 'confirmed', 'Đã quét kiểm tra thực tế khớp'),
  ('audit-1', 'dev-2', 'confirmed', 'Đang ở P.402 IT'),
  ('audit-1', 'dev-3', 'confirmed', 'P.405 R&D, đúng tem tài sản'),
  ('audit-1', 'dev-4', 'confirmed', 'P.405 Designer, màn hình tốt'),
  ('audit-1', 'dev-5', 'confirmed', 'P.301 Sales'),
  ('audit-1', 'dev-6', 'confirmed', 'Trong tủ kho IT tầng 4'),
  ('audit-1', 'dev-7', 'confirmed', 'Tại Rack 02 Server room'),
  ('audit-1', 'dev-8', 'confirmed', 'Tủ rack mạng tầng 3'),
  ('audit-1', 'dev-9', 'confirmed', 'Khu vực in ấn tầng 5'),
  ('audit-1', 'dev-10', 'confirmed', 'Nhân viên mượn có phiếu hợp lệ'),
  ('audit-1', 'dev-11', 'discrepancy', 'Bị lỗi sọc màn hình, đã gửi bảo hành LG'),
  ('audit-1', 'dev-12', 'discrepancy', 'Hỏng mainboard tại kho B1, đề xuất thanh lý'),
  ('audit-1', 'dev-13', 'confirmed', 'Đã hoàn tất thanh lý có biên bản kế toán'),
  ('audit-1', 'dev-1791615545426', 'confirmed', 'Phát hiện lỗi / Lệch vị trí');

INSERT INTO app_metadata (key, value)
VALUES
  ('updatedAt', '2026-10-17T09:22:59.295Z');

COMMIT;
