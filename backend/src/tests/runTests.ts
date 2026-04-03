import { authServiceTests } from "./authService.test";
import { transacaoServiceTests, TestCase } from "./transacaoService.test";
import { userServiceTests } from "./userService.test";

const tests: TestCase[] = [
  ...authServiceTests,
  ...userServiceTests,
  ...transacaoServiceTests,
];

const run = async () => {
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test.run();
      passed += 1;
      console.log(`PASS ${test.name}`);
    } catch (error) {
      failed += 1;
      console.error(`FAIL ${test.name}`);
      console.error(error);
    }
  }

  console.log("");
  console.log(`Total: ${tests.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
};

run().catch((error) => {
  console.error("Falha ao executar suite de testes:");
  console.error(error);
  process.exit(1);
});
