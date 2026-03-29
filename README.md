# Mọi người check out qua nhánh mobile, code toàn bộ trên mobile, không cần merge main, khi nào xong toàn bộ FE nhóm merge sau

git branch --show-current
git checkout mobile

- code xong mỗi phần:
  git add . ;
  git commit -m "..."
  git push

# Khi hoàn tất FE và muốn nhập vào main:

Chuyển về main và cập nhật mới nhất
git checkout main
git pull origin main

Merge nhánh mobile vào main
git merge mobile

Đẩy main lên remote
git push origin main

Nếu có conflict:
mở file conflict để sửa
sau khi sửa: git add .
hoàn tất merge: git commit
rồi git push origin main
