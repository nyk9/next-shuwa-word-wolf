import { getUsers } from "@/lib/getUsers";

export default async function UserPage() {
  const users = await getUsers();
  console.log(users);
  return (
    <div className="">
      {users.map((user: string) => (
        <div key={user}>ユーザー： {user}</div>
      ))}
    </div>
  );
}
