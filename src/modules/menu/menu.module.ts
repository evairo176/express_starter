import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';

const menuService = new MenuService();
const menuController = new MenuController(menuService);

export { menuService, menuController };
