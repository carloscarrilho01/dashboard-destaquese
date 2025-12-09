const fs = require('fs');
const path = require('path');

const DB_FILE = './conversations.db';
const BACKUP_DIR = './backups';

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR);
}

function createBackup() {
  if (!fs.existsSync(DB_FILE)) {
    console.error('❌ Banco de dados não encontrado!');
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const backupFile = path.join(BACKUP_DIR, `conversations-backup-${timestamp}.db`);

  try {
    fs.copyFileSync(DB_FILE, backupFile);
    const stats = fs.statSync(backupFile);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log('✓ Backup criado com sucesso!');
    console.log(`  Arquivo: ${backupFile}`);
    console.log(`  Tamanho: ${sizeMB} MB`);
    console.log(`  Data: ${new Date().toLocaleString('pt-BR')}`);

    listBackups();
  } catch (error) {
    console.error('❌ Erro ao criar backup:', error.message);
    process.exit(1);
  }
}

function listBackups() {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('conversations-backup-') && f.endsWith('.db'))
    .map(f => {
      const fullPath = path.join(BACKUP_DIR, f);
      const stats = fs.statSync(fullPath);
      return {
        name: f,
        path: fullPath,
        size: stats.size,
        date: stats.mtime
      };
    })
    .sort((a, b) => b.date - a.date);

  if (files.length === 0) {
    console.log('\nℹ️  Nenhum backup encontrado.');
    return;
  }

  console.log('\n📁 Backups disponíveis:');
  console.log('─'.repeat(80));

  files.forEach((file, idx) => {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const dateStr = file.date.toLocaleString('pt-BR');
    console.log(`${(idx + 1).toString().padStart(2)}. ${file.name}`);
    console.log(`    Data: ${dateStr} | Tamanho: ${sizeMB} MB`);
  });

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const totalMB = (totalSize / (1024 * 1024)).toFixed(2);
  console.log('─'.repeat(80));
  console.log(`Total: ${files.length} backups | ${totalMB} MB`);
}

function restoreBackup(backupFile) {
  const backupPath = backupFile.startsWith(BACKUP_DIR)
    ? backupFile
    : path.join(BACKUP_DIR, backupFile);

  if (!fs.existsSync(backupPath)) {
    console.error('❌ Arquivo de backup não encontrado:', backupPath);
    process.exit(1);
  }

  if (fs.existsSync(DB_FILE)) {
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const tempBackup = `${DB_FILE}.pre-restore-${timestamp}.bak`;
    fs.copyFileSync(DB_FILE, tempBackup);
    console.log(`ℹ️  Backup de segurança criado: ${tempBackup}`);
  }

  try {
    fs.copyFileSync(backupPath, DB_FILE);
    console.log('✓ Banco de dados restaurado com sucesso!');
    console.log(`  Origem: ${backupPath}`);
    console.log(`  Destino: ${DB_FILE}`);
  } catch (error) {
    console.error('❌ Erro ao restaurar backup:', error.message);
    process.exit(1);
  }
}

function cleanOldBackups(keepCount = 10) {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('conversations-backup-') && f.endsWith('.db'))
    .map(f => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      date: fs.statSync(path.join(BACKUP_DIR, f)).mtime
    }))
    .sort((a, b) => b.date - a.date);

  if (files.length <= keepCount) {
    console.log(`ℹ️  Apenas ${files.length} backups encontrados. Mantendo todos.`);
    return;
  }

  const toDelete = files.slice(keepCount);
  let deletedSize = 0;

  console.log(`\n🗑️  Removendo ${toDelete.length} backups antigos (mantendo os ${keepCount} mais recentes)...`);

  toDelete.forEach(file => {
    const stats = fs.statSync(file.path);
    deletedSize += stats.size;
    fs.unlinkSync(file.path);
    console.log(`   ✓ Removido: ${file.name}`);
  });

  const freedMB = (deletedSize / (1024 * 1024)).toFixed(2);
  console.log(`\n✓ ${toDelete.length} backups removidos | ${freedMB} MB liberados`);
}

function autoBackup(intervalMinutes = 60) {
  console.log(`🔄 Backup automático iniciado (a cada ${intervalMinutes} minutos)`);
  console.log('   Pressione Ctrl+C para parar\n');

  const interval = intervalMinutes * 60 * 1000;

  createBackup();

  setInterval(() => {
    console.log('\n⏰ Executando backup automático...');
    createBackup();
  }, interval);
}

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'create':
    createBackup();
    break;

  case 'list':
    listBackups();
    break;

  case 'restore':
    if (!args[1]) {
      console.error('Uso: node backup.js restore <arquivo-backup>');
      console.log('\nDica: Use "node backup.js list" para ver backups disponíveis');
      process.exit(1);
    }
    restoreBackup(args[1]);
    break;

  case 'clean':
    const keepCount = args[1] ? parseInt(args[1]) : 10;
    cleanOldBackups(keepCount);
    break;

  case 'auto':
    const interval = args[1] ? parseInt(args[1]) : 60;
    autoBackup(interval);
    break;

  default:
    console.log('🛟 Sistema de Backup do Painel WhatsApp\n');
    console.log('Comandos disponíveis:');
    console.log('  node backup.js create                - Criar novo backup');
    console.log('  node backup.js list                  - Listar backups existentes');
    console.log('  node backup.js restore <arquivo>     - Restaurar backup');
    console.log('  node backup.js clean [quantidade]    - Limpar backups antigos (padrão: manter 10)');
    console.log('  node backup.js auto [minutos]        - Backup automático (padrão: 60 min)');
    console.log('\nExemplos:');
    console.log('  node backup.js create');
    console.log('  node backup.js restore conversations-backup-2024-12-09T10-30-00.db');
    console.log('  node backup.js clean 5');
    console.log('  node backup.js auto 30');
}
