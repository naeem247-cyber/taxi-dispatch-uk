import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../database/entities/account.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountsRepo: Repository<Account>,
  ) {}

  findByEmail(email: string): Promise<Account | null> {
    return this.accountsRepo.findOne({ where: { email } });
  }

  findById(id: string): Promise<Account | null> {
    return this.accountsRepo.findOne({ where: { id } });
  }
}
