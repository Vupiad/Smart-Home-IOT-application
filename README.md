git branch --show-current

git checkout mobile

Đẩy nhánh mobile lên remote để backup và làm việc nhóm
git push -u origin mobile

code xong mỗi phần:
git add . ;
git commit -m "..."
git push

Khi hoàn tất FE và muốn nhập vào main:

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
