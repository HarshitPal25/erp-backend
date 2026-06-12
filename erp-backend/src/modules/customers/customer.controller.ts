import Customer from "../../models/customer.model";

export const createCustomer = async (req: any, res: any) => {
  try {
    const { companyName } = req.body;

    if (!companyName || typeof companyName !== "string" || !companyName.trim()) {
      res.status(400).json({
        success: false,
        message: "companyName is required",
      });
      return;
    }

    const customer = await Customer.create(req.body);

    res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCustomers = async (req: any, res: any) => {
  try {
    const customers = await Customer.find().sort({ companyName: 1 });

    res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCustomerById = async (req: any, res: any) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      res.status(404).json({
        success: false,
        message: "Customer not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
