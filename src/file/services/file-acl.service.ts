import { Injectable } from '@nestjs/common';

import { ROLE } from '../../auth/constants/role.constant';
import { BaseAclService } from '../../shared/acl/acl.service';
import { Action } from '../../shared/acl/action.constant';
import { Actor } from '../../shared/acl/actor.constant';
import { FileEntity } from '../entities/file.entity';

@Injectable()
export class FileAclService extends BaseAclService<FileEntity> {
  constructor() {
    super();
    this.canDo(ROLE.ADMIN, [Action.Manage]);
    this.canDo(ROLE.USER, [Action.Create, Action.List, Action.Read]);
    this.canDo(ROLE.USER, [Action.Delete], this.isFileOwner);
  }

  isFileOwner(file: FileEntity, user: Actor): boolean {
    return file.createdBy === user.id;
  }
}
