import { MigrationInterface, QueryRunner } from "typeorm";

export class FilesAddStorageType1723293163134 implements MigrationInterface {
    name = 'FilesAddStorageType1723293163134'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "publicKey" uuid NOT NULL, "privateKey" uuid NOT NULL, "fileBuffer" bytea, "createdAt" TIMESTAMP DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), "mimeType" character varying NOT NULL, "filePath" character varying, "fileName" character varying NOT NULL, "storageType" character varying NOT NULL, "createdBy" integer NOT NULL, CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "files"`);
    }

}
