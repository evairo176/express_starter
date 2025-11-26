import { db } from '../../database/database';

export class UserService {
  public async findUserById(userId: string) {
    const user = await db.user.findFirst({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        userPreferences: true,
      },
    });

    return user || null;
  }
}
