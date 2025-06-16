export async function getUsers() {
  const users = await fetch("http://localhost:3000/api/user", {
    cache: "no-store",
    method: "GET"
  });
  return users.json();
}
