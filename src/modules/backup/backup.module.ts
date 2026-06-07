import { BackupController } from './backup.controller';
import { backupService } from './backup.service';

const backupController = new BackupController(backupService);

export { backupService, backupController };
