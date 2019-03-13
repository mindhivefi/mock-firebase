import { MockFirebaseApp } from 'firebaseApp';
import { MockDatabase } from 'firestore';
import MockDocumentReference from 'firestore/MockDocumentReference';
import MockFieldValue from 'firestore/MockFieldValue';
import MockTimestamp from 'firestore/MockTimestamp';

describe('FieldValue', () => {
  describe('Delete sentinel', () => {
    const database: MockDatabase = {
      list: {
        docs: {
          a: {
            data: {
              first: 1,
              second: 2,
            },
          },
        },
      },
    };

    it('will delete field from data on the top level', async () => {
      const firestore = new MockFirebaseApp().firestore();

      firestore.mocker.fromMockDatabase(database);
      const ref = firestore.doc('list/a') as MockDocumentReference;

      await ref.update({
        first: MockFieldValue.delete(),
      });

      expect(ref.data).toEqual({
        second: 2,
      });
    });

    it('will delete field from sub object', async () => {
      const firestore = new MockFirebaseApp().firestore();

      firestore.mocker.fromMockDatabase(database);
      const ref = firestore.doc('list/a') as MockDocumentReference;

      await ref.set(
        {
          third: {
            sub: {
              A: 1,
              B: 2,
              C: 3,
            },
          },
        },
        {
          merge: true,
        },
      );
      await ref.update({
        third: {
          sub: {
            B: MockFieldValue.delete(),
          },
        },
      });

      expect(ref.data).toEqual({
        first: 1,
        second: 2,
        third: {
          sub: {
            A: 1,
            C: 3,
          },
        },
      });
    });

    // TODO fieldPath updates and sets with field values
  });
  describe('Timestamp sentinel', () => {
    describe('No server time defined', () => {
      it('will replace sentinels with timestamps', async () => {
        const database: MockDatabase = {
          list: {
            docs: {
              a: {
                data: {
                  first: 1,
                  second: 2,
                },
              },
            },
          },
        };
        const firestore = new MockFirebaseApp().firestore();

        firestore.mocker.fromMockDatabase(database);
        const ref = firestore.doc('list/a') as MockDocumentReference;

        await ref.update({
          first: MockFieldValue.serverTimestamp(),
        });

        expect(ref.data.first instanceof MockTimestamp).toBeTruthy();
      });
    });

    describe('Server time mocked with MockTimestamp value', () => {
      it('will replace sentinels with timestamps', async () => {
        const timestamp = MockTimestamp.fromDate(new Date('2019-03-11 20:47'));
        const database: MockDatabase = {
          list: {
            docs: {
              a: {
                data: {
                  first: 1,
                  second: 2,
                },
              },
            },
          },
        };
        const firestore = new MockFirebaseApp().firestore();
        firestore.mocker.serverTime = timestamp;

        firestore.mocker.fromMockDatabase(database);
        const ref = firestore.doc('list/a') as MockDocumentReference;

        await ref.update({
          first: MockFieldValue.serverTimestamp(),
        });

        expect(ref.data.first instanceof MockTimestamp).toBeTruthy();
        expect(timestamp.isEqual(ref.data.first)).toBe(true);
      });
    });

    describe('Server time mocked with a function', () => {
      it('will replace sentinels with timestamps', async () => {
        const timestamp = MockTimestamp.fromDate(new Date('2019-03-11 21:47'));
        const database: MockDatabase = {
          list: {
            docs: {
              a: {
                data: {
                  first: 1,
                  second: 2,
                },
              },
            },
          },
        };
        const firestore = new MockFirebaseApp().firestore();
        firestore.mocker.serverTime = () => timestamp;

        firestore.mocker.fromMockDatabase(database);
        const ref = firestore.doc('list/a') as MockDocumentReference;

        await ref.update({
          first: MockFieldValue.serverTimestamp(),
        });

        expect(ref.data.first instanceof MockTimestamp).toBeTruthy();
        expect(timestamp.isEqual(ref.data.first)).toBe(true);
      });
    });
  });

  describe('Array sentinels', () => {
    describe('arrayUnion', () => {
      it('will add a new value to the end of an array', async () => {
        const database: MockDatabase = {
          list: {
            docs: {
              a: {
                data: {
                  table: [1, 2],
                },
              },
            },
          },
        };
        const firestore = new MockFirebaseApp().firestore();

        firestore.mocker.fromMockDatabase(database);
        const ref = firestore.doc('list/a') as MockDocumentReference;

        await ref.set(
          {
            table: MockFieldValue.arrayUnion([3]),
          },
          {
            merge: true,
          },
        );

        expect(ref.data).toEqual({
          table: [1, 2, 3],
        });
      });

      it('will add only values that does not already exist in an array', async () => {
        const database: MockDatabase = {
          list: {
            docs: {
              a: {
                data: {
                  table: [1, 2],
                },
              },
            },
          },
        };
        const firestore = new MockFirebaseApp().firestore();

        firestore.mocker.fromMockDatabase(database);
        const ref = firestore.doc('list/a') as MockDocumentReference;

        await ref.set(
          {
            table: MockFieldValue.arrayUnion([2, 3, 4]),
          },
          {
            merge: true,
          },
        );

        expect(ref.data).toEqual({
          table: [1, 2, 3, 4],
        });
      });

      it('will override fieldvalue if it is not an array', async () => {
        const database: MockDatabase = {
          list: {
            docs: {
              a: {
                data: {
                  nottable: 1,
                },
              },
            },
          },
        };
        const firestore = new MockFirebaseApp().firestore();

        firestore.mocker.fromMockDatabase(database);
        const ref = firestore.doc('list/a') as MockDocumentReference;

        await ref.set(
          {
            nottable: MockFieldValue.arrayUnion([3, 4, 5]),
          },
          {
            merge: true,
          },
        );

        expect(ref.data).toEqual({
          nottable: [3, 4, 5],
        });
      });
    });

    describe('arrayRemove', () => {
      it('will remove a value from an array', async () => {
        const database: MockDatabase = {
          list: {
            docs: {
              a: {
                data: {
                  table: [1, 2],
                },
              },
            },
          },
        };
        const firestore = new MockFirebaseApp().firestore();

        firestore.mocker.fromMockDatabase(database);
        const ref = firestore.doc('list/a') as MockDocumentReference;

        await ref.set(
          {
            table: MockFieldValue.arrayRemove([1]),
          },
          {
            merge: true,
          },
        );

        expect(ref.data).toEqual({
          table: [2],
        });
      });

      it('will remove all values that does exist in an array', async () => {
        const database: MockDatabase = {
          list: {
            docs: {
              a: {
                data: {
                  table: [1, 2],
                },
              },
            },
          },
        };
        const firestore = new MockFirebaseApp().firestore();

        firestore.mocker.fromMockDatabase(database);
        const ref = firestore.doc('list/a') as MockDocumentReference;

        await ref.set(
          {
            table: MockFieldValue.arrayRemove([1, 2, 3, 4]),
          },
          {
            merge: true,
          },
        );

        expect(ref.data).toEqual({
          table: [],
        });
      });

      it('will override field value with an empty array if it is not an array', async () => {
        const database: MockDatabase = {
          list: {
            docs: {
              a: {
                data: {
                  nottable: 1,
                },
              },
            },
          },
        };
        const firestore = new MockFirebaseApp().firestore();

        firestore.mocker.fromMockDatabase(database);
        const ref = firestore.doc('list/a') as MockDocumentReference;

        await ref.set(
          {
            nottable: MockFieldValue.arrayRemove([3, 4, 5]),
          },
          {
            merge: true,
          },
        );

        expect(ref.data).toEqual({
          nottable: [],
        });
      });
    });
  });
});
