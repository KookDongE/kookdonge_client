import { api } from "@/app/lib/api";
import { RequestDTO } from "@/app/lib/RequestDTO";
import { ResponseDTO } from "@/app/lib/ResponseDTO";

interface RegisterUserReq {
  googleGrantCode: string;
  department: string;
  studentId: string;
  phoneNumber: string;
}

interface RegisterUserRes {}

export default async function registerUser({
  googleGrantCode,
  department,
  studentId,
  phoneNumber,
}: RegisterUserReq): Promise<RegisterUserRes> {
  let data = { googleGrantCode, department, studentId, phoneNumber };
  const response: ResponseDTO<RegisterUserRes> = await api.post(
    "/api/users/me",
    new RequestDTO(data),
  );

  return response.data;
}
