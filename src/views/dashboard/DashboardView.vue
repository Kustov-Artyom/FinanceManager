<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-label">Общий баланс</div>
          <div class="stat-value">125 400 ₽</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card income">
          <div class="stat-label">Доходы (апрель)</div>
          <div class="stat-value">+45 000 ₽</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card expense">
          <div class="stat-label">Расходы (апрель)</div>
          <div class="stat-value">-12 300 ₽</div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-card style="margin-top: 20px;">
      <h3>Последние транзакции</h3>
      <p style="color: #909399; margin-top: 20px;">
        Здесь будет список транзакций (подключим после создания бэка)
      </p>
    </el-card>
  </div>
</template>

<style scoped>
.stat-card {
  text-align: center;
  padding: 20px;
}

.stat-label {
  color: #606266;
  font-size: 14px;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #212529;
}

.stat-card.income .stat-value {
  color: #67c23a;
}

.stat-card.expense .stat-value {
  color: #f56c6c;
}
</style>