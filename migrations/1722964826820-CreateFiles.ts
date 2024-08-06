import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFiles1722964826820 implements MigrationInterface {
    name = 'CreateFiles1722964826820'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "publicKey" uuid NOT NULL, "privateKey" uuid NOT NULL, "fileBuffer" bytea NOT NULL, "createdAt" TIMESTAMP DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), "mimeType" character varying NOT NULL, "filePath" character varying NOT NULL, "fileName" character varying NOT NULL, "createdBy" integer NOT NULL, CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "files"`);
    }

}
